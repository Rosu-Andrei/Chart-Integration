import {AfterViewInit, Component} from '@angular/core';

import * as d3 from 'd3';
import * as Plotly from 'plotly.js-dist-min';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.css'
})
export class ChartComponent implements AfterViewInit {
  plotlyContainerStyle = 'position: relative; width: 800px; height: 800px;';

  angles = [
    {name: 'Homozygous Max', angle: 30, start: {x: 0, y: 0}, end: {}},
    {name: 'Heterozygous Min', angle: 50, start: {x: 0, y: 0}, end: {}},
    {name: 'Heterozygous Max', angle: 54, start: {x: 0, y: 0}, end: {}},
    {name: 'Homozygous Min', angle: 65, start: {x: 0, y: 0}, end: {}}
  ];

  axisRange: number = 6;
  lineData: any[] = [];
  curveData = {
    start: {x: 0, y: 4},
    end: {x: 4, y: 0},
    controlPoint: {x: 4, y: 4}
  };
  /**
   * will store the element with id 'plotly-chart'
   */
  plotlyChart: HTMLElement | null = null;
  /**
   * will store the element with id angle-input-container
   */
  angleInputContainer: HTMLElement | null = null;
  /**
   * will store the d3 selection for the svg-overlay class and svg
   */
  svg: any;
  /**
   * this two hold the values generated from d3.scaleLinear()
   */
  xScale: any;
  yScale: any;

  ngAfterViewInit() {
    this.initializeDOMElements();
    this.setupScales();
    this.buildAngleInputs();
    this.updatePlotAndDrag();
  }


  initializeDOMElements(): void {
    this.plotlyChart = document.getElementById('plotly-chart');
    this.angleInputContainer = document.getElementById('angle-input-container');
    this.svg = d3.select('.svg-overlay svg').style("pointer-events", "all");
  }

  setupScales(): void {
    this.xScale = d3.scaleLinear().domain([0, 6]).range([0, 800 - 100]);
    this.yScale = d3.scaleLinear().domain([0, 12]).range([800 - 80, 0]);
  }

  buildAngleInputs() {
    this.angles.forEach((ele, index) => {
      const angleRad = (ele.angle * Math.PI) / 180;
      const r = 1;
      const xx = r * Math.cos(angleRad);
      const yy = r * Math.sin(angleRad);
      const angleResult = this.calculateLineEndPoint(xx, yy);
      ele.end = {x: angleResult.x, y: angleResult.y};
      this.lineData.push(ele);

      if (this.angleInputContainer) {
        const angleLabel = document.createElement('div');
        angleLabel.className = 'angle-label';
        angleLabel.textContent = `${ele.name}:`;

        const angleInput = document.createElement('input');
        angleInput.type = 'text';
        angleInput.className = 'angle-input';
        angleInput.id = `angle-${index}`;
        angleInput.value = `${ele.angle.toFixed(2)}�`;

        this.angleInputContainer.appendChild(angleLabel);
        this.angleInputContainer.appendChild(angleInput);
      }
    });
  }

  calculateLineEndPoint(x: number, y: number) {
    const slope = y / x;
    const xMax = this.axisRange;
    const yMax = 12;
    const yAtXMax = slope * xMax;
    const xAtYMax = yMax / slope;

    if (yAtXMax <= yMax) {
      return {x: xMax, y: yAtXMax};
    } else {
      return {x: xAtYMax, y: yMax};
    }
  }

  calculateAngle(start: any, end: any) {
    return Math.atan2(end.y - start.y, end.x - start.x) * 180 / Math.PI;
  }

  updateAngleInputs() {
    this.lineData.forEach((line, index) => {
      const angle = this.calculateAngle(line.start, line.end);
      const angleInput = document.getElementById(`angle-${index}`) as HTMLInputElement;
      if (angleInput)
        angleInput.value = `${angle.toFixed(2)}�`;
    });
  }

  plotGraph() {

    const plotData: Plotly.Data[] = this.lineData.map((line, index) => ({
      x: [line.start.x, line.end.x],
      y: [line.start.y, line.end.y],
      type: 'scatter',
      mode: 'lines',
      name: line.name,
      line: {color: 'blue', class: `line-${index}`},
      hoverinfo: 'name'
    }));

    const xAxis: Plotly.Data = {
      x: [0, this.axisRange],
      y: [0, 0],
      type: 'scatter',
      mode: 'lines',
      line: {color: 'black'},
      showlegend: false,
      hoverinfo: 'skip'
    };

    const yAxis: Plotly.Data = {
      x: [0, 0],
      y: [0, this.axisRange],
      type: 'scatter',
      mode: 'lines',
      line: {color: 'black'},
      showlegend: false,
      hoverinfo: 'skip'
    };

    const data: Plotly.Data[] = [...plotData, xAxis, yAxis];

    const shapes: Partial<Plotly.Shape>[] = [
      {
        type: 'path',
        path: `M 0 0 L ${this.lineData[0].end.x} ${this.lineData[0].end.y} L ${this.lineData[1].end.x} ${this.lineData[1].end.y} Z`,
        fillcolor: 'rgba(0, 0, 255, 0.2)',
        line: {width: 2}
      },
      {
        type: 'path',
        path: `M 0 0 L ${this.lineData[2].end.x} ${this.lineData[2].end.y} L ${this.lineData[3].end.x} ${this.lineData[3].end.y} Z`,
        fillcolor: 'rgba(0, 0, 255, 0.2)',
        line: {width: 2}
      },
      {
        type: 'path',
        path: `M 0 0 L ${this.curveData.start.x} ${this.curveData.start.y} Q ${this.curveData.controlPoint.x} ${this.curveData.controlPoint.y}, ${this.curveData.end.x} ${this.curveData.end.y} Z`,
        fillcolor: 'rgba(0, 0, 255, 0.2)',
        line: {width: 2}
      }
    ];

    const layout: Partial<Plotly.Layout> = {
      xaxis: {
        range: [0, this.axisRange],
        zeroline: false,
        showgrid: false
      },
      yaxis: {
        range: [0, this.axisRange],
        scaleanchor: "x",
        scaleratio: 1,
        zeroline: false,
        showgrid: false
      },
      shapes: shapes,
      showlegend: true,
      width: 800,
      height: 800,
      dragmode: false, // Disable Plotly drag interactions
      hovermode: 'closest'
    };

    const config: Partial<Plotly.Config> = {
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'hoverClosestCartesian', 'hoverCompareCartesian']
    };

    Plotly.newPlot('plotly-chart', data, layout, config);
  }

  updatePlotAndDrag() {
    this.plotGraph();
    this.addDragInteractions();
  }

  addDragInteractions(): void {

    this.svg.selectAll('.draggable').remove();
    /**
     * ensures that the lines don't overlap each-other
     */
    const checkBoundaries = (newAngles: number[]) => {
      return (
        newAngles[0] < newAngles[1] &&
        newAngles[1] < newAngles[2] &&
        newAngles[2] < newAngles[3]
      );
    };
    /**
     * iterate over each line displayed in page
     */
    this.lineData.forEach((line, index) => {
      const dragHandler = d3.drag()
        .on('start', function () {
          d3.select(this).attr('cursor', 'grabbing');
          Plotly.restyle('plotly-chart', {'line.color': ['green']}, [index]);
        })
        .on('drag', (event) => {
          // Maybe here will be an error
          const [x, y] = d3.pointer(event);
          /**
           * dx and dy represents the difference in position between where the mouse started the dragging
           * and where it is now.
           */
          const dx = this.xScale.invert(x) - line.start.x;
          const dy = this.yScale.invert(y) - line.start.y;

          const angle = Math.atan2(dy, dx); // calculates the direction of the drag
          const length = Math.sqrt(
            (line.end.x - line.start.x) ** 2 +
            (line.end.y - line.start.y) ** 2
          );

          const newEndX = Math.max(this.xScale.domain()[0], Math.min(this.xScale.domain()[1], line.start.x + length * Math.cos(angle)));
          const newEndY = Math.max(this.yScale.domain()[0], Math.min(this.yScale.domain()[1], line.start.y + length * Math.sin(angle)));

          const angleResult = this.calculateLineEndPoint(newEndX, newEndY);

          const newLine = {...line, end: angleResult};
          const newAngle = this.calculateAngle(newLine.start, newLine.end);

          let newAngles = this.lineData.map((l, idx) => {
            if (idx === index)
              return newAngle;
            return this.calculateAngle(l.start, l.end);
          });

          // Check if new angles meet the constraints
          if (checkBoundaries(newAngles)) {
            line.end.x = angleResult.x;
            line.end.y = angleResult.y;
          }

          // Update Plotly chart with the new data
          this.plotGraph();
          // Update angle inputs
          this.updateAngleInputs();
          // Re-apply D3 drag interactions
          this.addDragInteractions();
        })
        .on('end', function () {
          d3.select(this).attr('cursor', 'pointer');
          Plotly.restyle('plotly-chart', {'line.color': ['blue']}, [index]);
        });

      const x1 = this.xScale(line.start.x);
      const y1 = this.yScale(line.start.y);
      const x2 = this.xScale(line.end.x);
      const y2 = this.yScale(line.end.y);


      /**
       * calculate length and midpoint for each line
       */
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lineLength = Math.sqrt(dx * dx + dy * dy);
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      // 6) Angle of the line in degrees:
      const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

      // 7) Draw a thin rectangle around the line
      //    - Make it width=10 (click "thickness"), height=lineLength
      //    - Position its center at (midX, midY)
      //    - Rotate around that center
      const rectWidth = 10; // how "thick" you want the clickable area
      const rectHeight = 50;

      let strokeColor = '';

      switch (index) {
        case 0:
          strokeColor = 'red';
          break;
        case 1:
          strokeColor = 'blue';
          break;
        case 2:
          strokeColor = 'yellow';
          break;
        case 3:
          strokeColor = 'purple';
          break;
        default:
          strokeColor = '';
          break;
      }


      this.svg.append("rect")
        .attr("class", `draggable draggable-${index}`)
        .attr('x', -rectWidth / 2)
        .attr('y',-200)
        .attr('width', rectWidth)
        .attr('height', rectHeight)
        .attr("fill", "transparent")
        .attr('stroke', strokeColor)
        .attr('stroke-width', 2)
        .attr('transform', `translate(${midX}, ${midY}) rotate(${angleDeg})`)
        .style("pointer-events", "all") // Ensure it can be interacted with
        .call(dragHandler);
    });

    const curveDragHandler = d3.drag()
      .on('drag', (event) => {
        const [x, y] = d3.pointer(event);
        const dy = this.yScale.invert(y) - this.curveData.controlPoint.y;
        if (dy > 0.1 && this.curveData.controlPoint.x < this.axisRange) {
          // Increase curve control points
          this.curveData.controlPoint.x += 1;
          this.curveData.controlPoint.y += 1;
          this.curveData.start.y += 1;
          this.curveData.end.x += 1;
        } else if (dy < -0.1 && this.curveData.controlPoint.x > 0) {
          // Decrease curve control points
          this.curveData.controlPoint.x -= 1;
          this.curveData.controlPoint.y -= 1;
          this.curveData.start.y -= 1;
          this.curveData.end.x -= 1;
        }

        // Update Plotly chart with the new data
        this.plotGraph();
        // Re-apply D3 drag interactions
        this.addDragInteractions();
      });

    this.svg.append("rect")
      .attr("class", "draggable-curve")
      .attr("x", this.xScale(this.curveData.start.x) - 10)
      .attr("y", Math.min(this.yScale(this.curveData.controlPoint.y), this.yScale(this.curveData.start.y)) - 10)
      .attr("width", this.xScale(this.curveData.end.x) + 20)
      .attr("height", Math.abs(this.yScale(this.curveData.start.y) - this.yScale(this.curveData.controlPoint.y)) + 20)
      .attr("fill", "transparent")
      .style("pointer-events", "all") // Ensure it can be interacted with
      .style('cursor', 'pointer')
      .call(curveDragHandler);
  }

}



