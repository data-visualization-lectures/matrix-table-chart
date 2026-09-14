(function (root) {
  'use strict';

  const H = () => root.MatrixTableHelpers;

  function renderStackedBar(ctx) {
    const { container, matrix, settings, animate } = ctx;
    const { width, height } = H().measureContainer(container);
    const margin = { top: 24, right: 24, bottom: 88, left: 56 };
    const innerWidth = Math.max(40, width - margin.left - margin.right);
    const innerHeight = Math.max(40, height - margin.top - margin.bottom);
    const svg = H().createSvg(container, width, height);
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const percent = settings.stackedMode !== 'absolute';
    const seriesKeys = matrix.colKeys;
    const stacked = matrix.rowKeys.map((rowKey, i) => {
      const row = { row: rowKey };
      let total = 0;
      seriesKeys.forEach((key, j) => {
        const value = Math.max(0, matrix.values[i][j] || 0);
        row[key] = value;
        total += value;
      });
      row.__total = total;
      if (percent && total > 0) {
        seriesKeys.forEach((key) => { row[key] = row[key] / total; });
      }
      return row;
    });

    const stack = d3.stack().keys(seriesKeys)(stacked);
    const x = d3.scaleBand().domain(matrix.rowKeys).range([0, innerWidth]).padding(0.18);
    const yMax = percent ? 1 : (d3.max(stacked, (d) => d.__total) || 1);
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);
    const colors = H().seriesColors(seriesKeys.length, 'tableau');

    const layers = g.selectAll('g.layer')
      .data(stack)
      .join('g')
      .attr('class', 'layer')
      .attr('fill', (d, i) => colors[i]);

    const rects = layers.selectAll('rect')
      .data((d) => d.map((item) => ({ ...item, key: d.key })))
      .join('rect')
      .attr('x', (d) => x(d.data.row))
      .attr('width', x.bandwidth())
      .attr('y', (d) => y(d[1]))
      .attr('height', (d) => Math.max(0, y(d[0]) - y(d[1])))
      .on('mousemove', (event, d) => {
        const raw = percent ? d[1] - d[0] : d.data[d.key];
        const label = percent ? `${H().formatNumber(raw * 100)}%` : H().formatNumber(raw);
        H().showTooltip(event, `${d.data.row}<br>${d.key}: <strong>${label}</strong>`);
      })
      .on('mouseleave', H().hideTooltip);

    g.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSizeOuter(0))
      .selectAll('text')
      .attr('text-anchor', 'end')
      .attr('transform', 'rotate(-35)')
      .attr('dx', '-0.4em')
      .attr('dy', '0.3em')
      .attr('fill', '#4b5563');

    g.append('g')
      .attr('class', 'axis y-axis')
      .call(
        d3.axisLeft(y)
          .ticks(5)
          .tickSizeOuter(0)
          .tickFormat(percent ? d3.format('.0%') : (v) => H().formatNumber(v))
      )
      .selectAll('text')
      .attr('fill', '#4b5563');

    if (settings.showValues) {
      const labels = layers.selectAll('text.value')
        .data((d) => d.map((item) => ({ ...item, key: d.key })))
        .join('text')
        .attr('class', 'value')
        .attr('x', (d) => x(d.data.row) + x.bandwidth() / 2)
        .attr('y', (d) => (y(d[0]) + y(d[1])) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .text((d) => {
          const raw = d[1] - d[0];
          if (raw <= 0.03 && percent) return '';
          return percent ? d3.format('.0%')(raw) : H().formatNumber(raw);
        });
      H().applyLabelStroke(labels);
    }

    if (animate) {
      rects.attr('y', innerHeight).attr('height', 0)
        .transition().duration(1000)
        .attr('y', (d) => y(d[1]))
        .attr('height', (d) => Math.max(0, y(d[0]) - y(d[1])));
    }
  }

  root.MatrixChartModules = root.MatrixChartModules || {};
  root.MatrixChartModules['stacked-bar'] = { id: 'stacked-bar', render: renderStackedBar, controlsHTML: '' };
})(window);
