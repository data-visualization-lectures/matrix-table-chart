(function (root) {
  'use strict';

  const H = () => root.MatrixTableHelpers;

  function renderMosaic(ctx) {
    const { container, matrix, settings, animate } = ctx;
    const { width, height } = H().measureContainer(container);
    const margin = { top: 24, right: 24, bottom: 88, left: 24 };
    const innerWidth = Math.max(40, width - margin.left - margin.right);
    const innerHeight = Math.max(40, height - margin.top - margin.bottom);
    const svg = H().createSvg(container, width, height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const rowTotals = matrix.rowKeys.map((_, i) => d3.sum(matrix.values[i], (v) => Math.max(0, v || 0)));
    const grand = d3.sum(rowTotals) || 1;
    const colors = H().seriesColors(matrix.colKeys.length, settings.colorScheme === 'tableau' ? 'tableau' : settings.colorScheme);

    let x0 = 0;
    const tiles = [];
    matrix.rowKeys.forEach((rowKey, i) => {
      const rowTotal = rowTotals[i] || 0;
      const rowWidth = (rowTotal / grand) * innerWidth;
      let y0 = 0;
      const denom = rowTotal || 1;
      matrix.colKeys.forEach((colKey, j) => {
        const value = Math.max(0, matrix.values[i][j] || 0);
        const tileHeight = (value / denom) * innerHeight;
        tiles.push({
          row: rowKey,
          col: colKey,
          value,
          x: x0,
          y: y0,
          width: rowWidth,
          height: tileHeight,
          color: colors[j],
        });
        y0 += tileHeight;
      });
      x0 += rowWidth;
    });

    const nodes = g.selectAll('g.tile')
      .data(tiles.filter((d) => d.width > 0 && d.height > 0))
      .join('g')
      .attr('class', 'tile');

    nodes.append('rect')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('width', (d) => Math.max(0, d.width - 1))
      .attr('height', (d) => Math.max(0, d.height - 1))
      .attr('fill', (d) => d.color)
      .on('mousemove', (event, d) => {
        H().showTooltip(event, `${d.row} × ${d.col}<br><strong>${H().formatNumber(d.value)}</strong>`);
      })
      .on('mouseleave', H().hideTooltip);

    if (settings.showValues) {
      const labels = nodes.filter((d) => d.width > 36 && d.height > 18)
        .append('text')
        .attr('x', (d) => d.x + d.width / 2)
        .attr('y', (d) => d.y + d.height / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .text((d) => d.col);
      H().applyLabelStroke(labels);
    }

    let labelX = 0;
    const rowLabels = g.append('g').selectAll('text.row-label')
      .data(matrix.rowKeys.map((rowKey, i) => {
        const w = (rowTotals[i] / grand) * innerWidth;
        const item = { rowKey, x: labelX + w / 2 };
        labelX += w;
        return item;
      }))
      .join('text')
      .attr('class', 'row-label')
      .attr('x', (d) => d.x)
      .attr('y', innerHeight + 14)
      .attr('text-anchor', 'start')
      .attr('transform', (d) => `rotate(-35, ${d.x}, ${innerHeight + 14})`)
      .attr('font-size', 11)
      .text((d) => d.rowKey);
    H().applyLabelStroke(rowLabels);

    if (animate) {
      nodes.select('rect')
        .attr('opacity', 0)
        .transition().duration(1000)
        .attr('opacity', 1);
    }
  }

  root.MatrixChartModules = root.MatrixChartModules || {};
  root.MatrixChartModules.mosaic = { id: 'mosaic', render: renderMosaic, controlsHTML: '' };
})(window);
