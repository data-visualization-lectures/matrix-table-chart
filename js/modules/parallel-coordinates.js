(function (root) {
  'use strict';

  const H = () => root.MatrixTableHelpers;
  let brushes = [];

  function renderParallelCoordinates(ctx) {
    const { container, matrix, settings, animate } = ctx;
    const { width, height } = H().measureContainer(container);
    const axes = matrix.rowKeys;
    const series = matrix.colKeys;
    const labelAngle = 40;
    const labelSize = 10;
    const longest = d3.max(axes, (d) => [...String(d)].length) || 1;
    const labelLen = longest * labelSize;
    const rad = (labelAngle * Math.PI) / 180;
    const margin = {
      top: 28,
      right: Math.max(28, Math.ceil(labelLen * Math.cos(rad) + 12)),
      bottom: Math.max(56, Math.ceil(16 + labelLen * Math.sin(rad) + 12)),
      left: 52,
    };
    const innerWidth = Math.max(40, width - margin.left - margin.right);
    const innerHeight = Math.max(40, height - margin.top - margin.bottom);
    const svg = H().createSvg(container, width, height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scalePoint().domain(axes).range([0, innerWidth]);
    const values = matrix.cells.map((d) => d.value).filter((v) => v != null);
    const y = d3.scaleLinear().domain([d3.min(values) ?? 0, d3.max(values) ?? 1]).nice().range([innerHeight, 0]);
    const colors = H().seriesColors(series.length, 'tableau');
    const line = d3.line()
      .defined((d) => d.value != null)
      .x((d) => x(d.axis))
      .y((d) => y(d.value));

    const paths = series.map((colKey, j) => ({
      key: colKey,
      color: colors[j],
      points: axes.map((rowKey, i) => ({ axis: rowKey, value: matrix.values[i][j] })),
    }));

    const yAxis = g.append('g')
      .attr('class', 'axis y-axis')
      .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));
    yAxis.select('.domain').remove();
    yAxis.selectAll('text').attr('fill', '#4b5563');

    g.selectAll('path.series')
      .data(paths)
      .join('path')
      .attr('class', 'series')
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 2.2)
      .attr('d', (d) => line(d.points))
      .on('mousemove', (event, d) => H().showTooltip(event, d.key))
      .on('mouseleave', H().hideTooltip);

    const axisG = g.selectAll('g.pcp-axis')
      .data(axes)
      .join('g')
      .attr('class', 'pcp-axis')
      .attr('transform', (d) => `translate(${x(d)},0)`);

    axisG.append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#e5e7eb');

    const labelY = innerHeight + 10;
    const axisLabels = axisG.append('text')
      .attr('x', 4)
      .attr('y', labelY)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'start')
      .attr('transform', `rotate(${labelAngle}, 4, ${labelY})`)
      .attr('font-size', labelSize)
      .text((d) => d);
    H().applyLabelStroke(axisLabels);

    brushes = [];
    axisG.each(function (axisKey) {
      const brush = d3.brushY()
        .extent([[-12, 0], [12, innerHeight]])
        .on('brush end', () => {
          applyBrush(g, paths, y);
          syncResetControl();
        });
      d3.select(this).call(brush);
      brushes.push({ axisKey, brush, node: this });
    });

    if (animate) {
      g.selectAll('path.series')
        .attr('stroke-dasharray', function () { return this.getTotalLength(); })
        .attr('stroke-dashoffset', function () { return this.getTotalLength(); })
        .transition().duration(1000)
        .attr('stroke-dashoffset', 0)
        .on('end', function () {
          d3.select(this).attr('stroke-dasharray', null);
        });
    }
    void settings;
  }

  function applyBrush(g, paths, y) {
    const active = [];
    g.selectAll('g.pcp-axis').each(function (axisKey) {
      const selection = d3.brushSelection(this);
      if (selection) active.push({ axisKey, selection });
    });
    g.selectAll('path.series').classed('is-faded', (d) => {
      if (!active.length) return false;
      return !active.every(({ axisKey, selection }) => {
        const point = d.points.find((item) => item.axis === axisKey);
        if (!point || point.value == null) return false;
        const py = y(point.value);
        return py >= selection[0] && py <= selection[1];
      });
    });
  }

  function hasActiveBrush() {
    return brushes.some(({ node }) => !!d3.brushSelection(node));
  }

  function syncResetControl() {
    const btn = document.getElementById('pcp-reset');
    if (!btn) return;
    const show = hasActiveBrush();
    btn.style.visibility = show ? 'visible' : 'hidden';
    btn.style.pointerEvents = show ? 'auto' : 'none';
  }

  function resetBrushes() {
    brushes.forEach(({ node, brush }) => {
      d3.select(node).call(brush.move, null);
    });
    d3.selectAll('#chart-container path.series').classed('is-faded', false);
    syncResetControl();
  }

  root.MatrixChartModules = root.MatrixChartModules || {};
  root.MatrixChartModules['parallel-coordinates'] = {
    id: 'parallel-coordinates',
    render: renderParallelCoordinates,
    controlsHTML(lang) {
      const label = lang === 'en' ? 'Reset' : 'リセット';
      return `<button type="button" id="pcp-reset" class="dvz-control-btn">${label}</button>`;
    },
    bindControls() {
      document.getElementById('pcp-reset')?.addEventListener('click', resetBrushes);
      syncResetControl();
    },
    reset: resetBrushes,
  };
})(window);
