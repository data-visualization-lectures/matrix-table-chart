(function (root) {
  'use strict';

  const H = () => root.MatrixTableHelpers;

  function renderChord(ctx) {
    const { container, matrix, settings, lang } = ctx;
    const { width, height } = H().measureContainer(container);
    const svg = H().createSvg(container, width, height);

    if (!matrix.isSquare) {
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6b7280')
        .attr('font-size', 14)
        .text(lang === 'en'
          ? 'Chord needs a square matrix. Use Heatmap, or map matching row and column labels.'
          : 'コード図は正方形行列が必要です。Heatmap を使うか、行と列のラベルを揃えてください。');
      return;
    }

    const aligned = root.MatrixModel.alignSquare(matrix);
    const size = Math.min(width, height);
    const outerRadius = size / 2 - 48;
    const innerRadius = outerRadius - 18;
    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);
    const numeric = aligned.rowKeys.map((_, i) => aligned.colKeys.map((_, j) => Math.max(0, aligned.values[i][j] || 0)));
    const colors = H().seriesColors(aligned.rowKeys.length, 'tableau');
    const chord = d3.chord().padAngle(0.04).sortSubgroups(d3.descending)(numeric);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius - 2);

    const group = g.append('g').selectAll('g')
      .data(chord.groups)
      .join('g');

    group.append('path')
      .attr('fill', (d) => colors[d.index])
      .attr('d', arc)
      .on('mousemove', (event, d) => H().showTooltip(event, aligned.rowKeys[d.index]))
      .on('mouseleave', H().hideTooltip);

    const labels = group.append('text')
      .attr('dy', '0.35em')
      .attr('transform', (d) => {
        const angle = (d.startAngle + d.endAngle) / 2;
        return `rotate(${(angle * 180) / Math.PI - 90}) translate(${outerRadius + 10})${angle > Math.PI ? ' rotate(180)' : ''}`;
      })
      .attr('text-anchor', (d) => ((d.startAngle + d.endAngle) / 2 > Math.PI ? 'end' : 'start'))
      .attr('font-size', 11)
      .text((d) => aligned.rowKeys[d.index]);
    H().applyLabelStroke(labels);

    const ribbons = g.append('g')
      .selectAll('path')
      .data(chord)
      .join('path')
      .attr('d', ribbon)
      .attr('fill', (d) => colors[d.source.index])
      .attr('fill-opacity', 0.7)
      .on('mousemove', (event, d) => {
        H().showTooltip(
          event,
          `${aligned.rowKeys[d.source.index]} → ${aligned.rowKeys[d.target.index]}<br><strong>${H().formatNumber(d.source.value)}</strong>`
        );
      })
      .on('mouseleave', H().hideTooltip);

    if (ctx.animate) {
      group.select('path').attr('opacity', 0).transition().duration(1000).attr('opacity', 1);
      ribbons.attr('opacity', 0).transition().duration(1000).attr('opacity', 1);
    }

    void settings;
  }

  root.MatrixChartModules = root.MatrixChartModules || {};
  root.MatrixChartModules.chord = { id: 'chord', render: renderChord, controlsHTML: '' };
})(window);
