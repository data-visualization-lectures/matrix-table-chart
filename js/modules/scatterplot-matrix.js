(function (root) {
  'use strict';

  const H = () => root.MatrixTableHelpers;
  let splomBrushes = [];

  function renderSplom(ctx) {
    const { container, matrix, settings, animate } = ctx;
    const { width, height } = H().measureContainer(container);
    const maxAxes = Math.max(2, Math.min(settings.splomMaxAxes || 6, matrix.colKeys.length, 8));
    const axes = matrix.colKeys.slice(0, maxAxes);
    const padding = 46;
    const size = Math.min(width, height) - 16;
    const cell = (size - padding) / axes.length;
    const svg = H().createSvg(container, Math.max(width, size), Math.max(height, size));
    const g = svg.append('g').attr('transform', 'translate(8,8)');
    const scales = {};
    axes.forEach((axis) => {
      const j = matrix.colKeys.indexOf(axis);
      const values = matrix.values.map((row) => row[j]).filter((v) => v != null);
      scales[axis] = d3.scaleLinear().domain(d3.extent(values)).nice().range([cell - 12, 8]);
    });

    const rows = matrix.rowKeys.map((rowKey, i) => ({
      row: rowKey,
      values: Object.fromEntries(matrix.colKeys.map((key, j) => [key, matrix.values[i][j]])),
    }));

    splomBrushes = [];

    axes.forEach((yKey, row) => {
      axes.forEach((xKey, col) => {
        const cellG = g.append('g').attr('transform', `translate(${padding + col * cell},${row * cell})`);
        cellG.append('rect')
          .attr('class', 'splom-frame')
          .attr('width', cell)
          .attr('height', cell)
          .attr('fill', row === col ? '#f9fafb' : '#ffffff')
          .attr('stroke', '#e5e7eb');

        if (row === col) {
          const label = cellG.append('text')
            .attr('x', cell / 2)
            .attr('y', cell / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', 11)
            .text(yKey);
          H().applyLabelStroke(label);
          return;
        }

        const points = rows.filter((d) => d.values[xKey] != null && d.values[yKey] != null);
        const dots = cellG.selectAll('circle.splom-dot')
          .data(points)
          .join('circle')
          .attr('class', 'splom-dot')
          .attr('cx', (d) => scales[xKey](d.values[xKey]))
          .attr('cy', (d) => scales[yKey](d.values[yKey]))
          .attr('r', 3.2)
          .attr('fill', '#2563eb')
          .attr('fill-opacity', 0.75)
          .on('mousemove', (event, d) => {
            H().showTooltip(event, `${d.row}<br>${xKey}: ${H().formatNumber(d.values[xKey])}<br>${yKey}: ${H().formatNumber(d.values[yKey])}`);
          })
          .on('mouseleave', H().hideTooltip);

        const brushG = cellG.append('g').attr('class', 'splom-brush');
        const brush = d3.brush()
          .extent([[0, 0], [cell, cell]])
          .on('brush end', applySplomBrush);
        brushG.call(brush);
        splomBrushes.push({ group: brushG, brush, xKey, yKey, xScale: scales[xKey], yScale: scales[yKey] });

        if (animate) {
          dots.attr('r', 0).transition().duration(1000).attr('r', 3.2);
        }
      });
    });
  }

  function applySplomBrush() {
    const active = splomBrushes
      .map((item) => ({ ...item, selection: d3.brushSelection(item.group.node()) }))
      .filter((item) => item.selection);
    d3.selectAll('#chart-container circle.splom-dot').classed('is-faded', (d) => {
      if (!active.length) return false;
      return !active.every(({ selection, xKey, yKey, xScale, yScale }) => {
        const px = xScale(d.values[xKey]);
        const py = yScale(d.values[yKey]);
        return px >= selection[0][0] && px <= selection[1][0] && py >= selection[0][1] && py <= selection[1][1];
      });
    });
  }

  function resetBrushes() {
    splomBrushes.forEach(({ group, brush }) => {
      group.call(brush.move, null);
    });
    d3.selectAll('#chart-container circle.splom-dot').classed('is-faded', false);
  }

  root.MatrixChartModules = root.MatrixChartModules || {};
  root.MatrixChartModules['scatterplot-matrix'] = {
    id: 'scatterplot-matrix',
    render: renderSplom,
    controlsHTML: '<button type="button" id="splom-reset" class="dvz-control-btn">Reset</button>',
    bindControls() {
      document.getElementById('splom-reset')?.addEventListener('click', resetBrushes);
    },
    reset: resetBrushes,
  };
})(window);
