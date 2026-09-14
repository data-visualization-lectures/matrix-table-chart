(function (root) {
  'use strict';

  const H = () => root.MatrixTableHelpers;

  function renderHeatmap(ctx) {
    const { container, matrix, settings } = ctx;
    const { width, height } = H().measureContainer(container);
    const margin = { top: 72, right: 16, bottom: 16, left: 148 };
    const innerWidth = Math.max(40, width - margin.left - margin.right);
    const innerHeight = Math.max(40, height - margin.top - margin.bottom);
    const cols = matrix.colKeys.length || 1;
    const rows = matrix.rowKeys.length || 1;
    const gap = 1;
    const svg = H().createSvg(container, width, height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(matrix.colKeys).range([0, innerWidth]).padding(0);
    const y = d3.scaleBand().domain(matrix.rowKeys).range([0, innerHeight]).padding(0);
    const values = matrix.cells.map((d) => d.value).filter((v) => v != null);
    const min = d3.min(values) ?? 0;
    const max = d3.max(values) ?? 1;
    const diverging = settings.heatmapDiverging || min < 0;
    const interpolator = H().colorInterpolator(settings.colorScheme, diverging);
    const useLog = !diverging && min >= 0 && max > 0 && max > Math.max(min, 1) * 8;
    const color = diverging
      ? d3.scaleDiverging(interpolator).domain([min, 0, max])
      : d3.scaleSequential(interpolator).domain(useLog ? [0, Math.log1p(max)] : [min, max]);
    const colorOf = (value) => (useLog ? color(Math.log1p(value || 0)) : color(value));
    const cellW = Math.max(1, x.bandwidth() - gap);
    const cellH = Math.max(1, y.bandwidth() - gap);

    const cells = g.selectAll('g.cell')
      .data(matrix.cells)
      .join('g')
      .attr('class', 'cell')
      .attr('transform', (d) => `translate(${x(d.col)},${y(d.row)})`);

    cells.append('rect')
      .attr('width', cellW)
      .attr('height', cellH)
      .attr('rx', 1)
      .attr('fill', (d) => (d.value == null ? '#f3f4f6' : colorOf(d.value)))
      .on('mousemove', (event, d) => {
        H().showTooltip(event, `${d.row} × ${d.col}<br><strong>${H().formatNumber(d.value)}</strong>`);
      })
      .on('mouseleave', H().hideTooltip);

    if (settings.showValues) {
      const labels = cells.append('text')
        .attr('x', cellW / 2)
        .attr('y', cellH / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', Math.max(8, Math.min(12, cellW / 4, cellH / 2)))
        .text((d) => H().formatNumber(d.value));
      H().applyLabelStroke(labels);
    }

    const xLabels = g.append('g').attr('class', 'axis x-axis')
      .selectAll('text')
      .data(matrix.colKeys)
      .join('text')
      .attr('x', (d) => x(d) + x.bandwidth() / 2)
      .attr('y', -10)
      .attr('text-anchor', 'start')
      .attr('transform', (d) => `rotate(-40, ${x(d) + x.bandwidth() / 2}, -10)`)
      .attr('font-size', 11)
      .text((d) => d);
    H().applyLabelStroke(xLabels);

    const yLabels = g.append('g').attr('class', 'axis y-axis')
      .selectAll('text')
      .data(matrix.rowKeys)
      .join('text')
      .attr('x', -8)
      .attr('y', (d) => y(d) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', 11)
      .text((d) => d);
    H().applyLabelStroke(yLabels);
  }

  root.MatrixChartModules = root.MatrixChartModules || {};
  root.MatrixChartModules.heatmap = { id: 'heatmap', render: renderHeatmap, controlsHTML: '' };
})(window);
