(function (root) {
  'use strict';

  const H = () => root.MatrixTableHelpers;
  const ORDER_KEYS = ['name', 'count', 'group'];
  let adjacencyState = null;

  function resolveOrder(settings) {
    const value = settings?.adjacencyOrder;
    return ORDER_KEYS.includes(value) ? value : 'name';
  }

  function controlsHTML(lang) {
    const ja = lang !== 'en';
    return [
      '<div class="dvz-controls-row">',
      '<label class="dvz-control">',
      `<span class="dvz-control-label">${ja ? '並び替え' : 'Order'}</span>`,
      '<select id="adjacency-order" class="dvz-control-select">',
      `<option value="name">${ja ? '名前' : 'by Name'}</option>`,
      `<option value="count">${ja ? '頻度' : 'by Frequency'}</option>`,
      `<option value="group">${ja ? 'クラスタ' : 'by Cluster'}</option>`,
      '</select>',
      '</label>',
      '</div>',
    ].join('');
  }

  function prefersReducedMotion() {
    return typeof root.matchMedia === 'function' && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function applyOrder(orderKey, animate) {
    if (!adjacencyState) return;
    const { x, size, svg } = adjacencyState;
    const next = adjacencyState.orders[orderKey] || adjacencyState.orders.name;
    x.domain(next);
    adjacencyState.orderKey = orderKey;
    const duration = animate && !prefersReducedMotion() ? 1000 : 0;
    const transition = svg.transition().duration(duration).ease(d3.easeCubicInOut);
    transition.selectAll('.adjacency-row')
      .delay((_, i) => (duration ? (x(i) / size) * 400 : 0))
      .attr('transform', (_, i) => `translate(0,${x(i)})`);
    transition.selectAll('.adjacency-row .cell')
      .delay((d) => (duration ? (x(d.x) / size) * 400 : 0))
      .attr('x', (d) => x(d.x));
    transition.selectAll('.adjacency-column')
      .delay((_, i) => (duration ? (x(i) / size) * 400 : 0))
      .attr('transform', (_, i) => `translate(${x(i)},0)`);
  }

  function renderAdjacencyMatrix(ctx) {
    const { container, matrix, settings, lang } = ctx;
    const { width, height } = H().measureContainer(container);
    const svg = H().createSvg(container, width, height);
    svg.attr('class', 'adjacency-matrix');
    adjacencyState = null;

    if (!matrix.isSquare) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6b7280')
        .attr('font-size', 14)
        .text(lang === 'en'
          ? 'Adjacency matrix needs a square matrix. Use Heatmap, or map matching row and column labels.'
          : '隣接行列は正方形行列が必要です。Heatmap を使うか、行と列のラベルを揃えてください。');
      return;
    }

    const aligned = root.MatrixModel.alignSquare(matrix);
    const n = aligned.rowKeys.length;
    const groups = aligned.groups || {};
    const nodes = aligned.rowKeys.map((name, i) => ({
      name,
      index: i,
      group: groups[name] == null || groups[name] === '' ? 0 : groups[name],
      count: d3.sum(aligned.values[i], (value) => value || 0),
    }));
    const cells = nodes.map((rowNode, i) => nodes.map((colNode, j) => ({
      x: j,
      y: i,
      z: aligned.values[i][j] || 0,
    })));
    const indexes = d3.range(n);
    const orders = {
      name: indexes.slice().sort((a, b) => d3.ascending(nodes[a].name, nodes[b].name)),
      count: indexes.slice().sort((a, b) => nodes[b].count - nodes[a].count),
      group: indexes.slice().sort((a, b) => nodes[b].group - nodes[a].group),
    };
    const orderKey = resolveOrder(settings);
    const longest = d3.max(nodes, (d) => [...String(d.name)].length) || 1;
    const fontSize = n > 40 ? 7 : 10;
    const labelSpace = Math.min(140, Math.max(56, Math.ceil(longest * fontSize * 0.62)));
    const margin = { top: labelSpace, right: 12, bottom: 12, left: labelSpace };
    const size = Math.max(40, Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom));
    const tx = margin.left + Math.max(0, (width - margin.left - margin.right - size) / 2);
    const ty = margin.top + Math.max(0, (height - margin.top - margin.bottom - size) / 2);
    const g = svg.append('g').attr('transform', `translate(${tx},${ty})`);
    const x = d3.scaleBand().domain(orders[orderKey]).range([0, size]);
    const band = x.bandwidth();
    const zMax = d3.max(cells, (row) => d3.max(row, (cell) => cell.z)) || 1;
    const opacity = d3.scaleLinear().domain([0, 4]).clamp(true);
    const hasGroups = nodes.some((node) => node.group);
    const groupKeys = [];
    const seenGroups = new Set();
    nodes.forEach((node) => {
      const key = String(node.group);
      if (seenGroups.has(key)) return;
      seenGroups.add(key);
      groupKeys.push(node.group);
    });
    const scheme = settings.colorScheme || 'tableau';
    const interpolator = H().colorInterpolator(scheme);
    const groupCount = groupKeys.length || 1;
    const groupColors = scheme === 'tableau'
      ? d3.range(groupCount).map((i) => d3.schemeTableau10[i % 10])
      : d3.range(groupCount).map((i) => interpolator(groupCount === 1 ? 0.65 : 0.2 + (0.7 * i) / Math.max(groupCount - 1, 1)));
    const groupColor = d3.scaleOrdinal().domain(groupKeys).range(groupColors);
    const sequential = d3.scaleSequential(interpolator).domain([0, zMax]);
    const fillOf = (d) => {
      if (hasGroups) {
        if (nodes[d.x].group === nodes[d.y].group) return groupColor(nodes[d.x].group);
        return '#000';
      }
      return sequential(d.z);
    };

    g.append('rect')
      .attr('class', 'background')
      .attr('width', size)
      .attr('height', size)
      .attr('fill', '#eee');

    const rows = g.selectAll('g.adjacency-row')
      .data(cells)
      .join('g')
      .attr('class', 'adjacency-row')
      .attr('transform', (_, i) => `translate(0,${x(i)})`);

    rows.selectAll('rect.cell')
      .data((row) => row.filter((item) => item.z))
      .join('rect')
      .attr('class', 'cell')
      .attr('x', (d) => x(d.x))
      .attr('width', band)
      .attr('height', band)
      .attr('fill', fillOf)
      .attr('fill-opacity', (d) => (hasGroups ? opacity(d.z) : 1))
      .on('mousemove', (event, d) => {
        highlight(d);
        H().showTooltip(
          event,
          `${nodes[d.y].name} × ${nodes[d.x].name}<br><strong>${H().formatNumber(d.z)}</strong>`
        );
      })
      .on('mouseleave', () => {
        highlight(null);
        H().hideTooltip();
      });

    rows.append('line')
      .attr('x2', size)
      .attr('stroke', '#fff')
      .attr('shape-rendering', 'crispEdges');

    const rowLabels = rows.append('text')
      .attr('class', 'adjacency-row-label')
      .attr('x', -6)
      .attr('y', band / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .attr('font-size', fontSize)
      .text((_, i) => nodes[i].name);
    H().applyLabelStroke(rowLabels);

    const columns = g.selectAll('g.adjacency-column')
      .data(nodes)
      .join('g')
      .attr('class', 'adjacency-column')
      .attr('transform', (_, i) => `translate(${x(i)},0)`);

    columns.append('line')
      .attr('y2', size)
      .attr('stroke', '#fff')
      .attr('shape-rendering', 'crispEdges');

    const colLabels = columns.append('text')
      .attr('class', 'adjacency-col-label')
      .attr('x', 6)
      .attr('y', band / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'start')
      .attr('font-size', fontSize)
      .attr('transform', 'rotate(-90)')
      .text((d) => d.name);
    H().applyLabelStroke(colLabels);

    function highlight(cell) {
      rowLabels.attr('fill', (_, i) => (cell && i === cell.y ? '#dc2626' : '#111827'));
      colLabels.attr('fill', (d) => (cell && d.index === cell.x ? '#dc2626' : '#111827'));
    }

    adjacencyState = { svg, x, size, orders, orderKey, settings };
  }

  function bindControls() {
    const select = document.getElementById('adjacency-order');
    if (!select) return;
    select.value = adjacencyState?.orderKey
      || adjacencyState?.settings?.adjacencyOrder
      || root.matrixTableApp?.settings?.adjacencyOrder
      || 'name';
    select.onchange = () => {
      const value = resolveOrder({ adjacencyOrder: select.value });
      if (adjacencyState?.settings) adjacencyState.settings.adjacencyOrder = value;
      if (root.matrixTableApp?.settings) root.matrixTableApp.settings.adjacencyOrder = value;
      applyOrder(value, true);
    };
  }

  root.MatrixChartModules = root.MatrixChartModules || {};
  root.MatrixChartModules['adjacency-matrix'] = {
    id: 'adjacency-matrix',
    render: renderAdjacencyMatrix,
    controlsHTML,
    bindControls,
  };
})(window);
