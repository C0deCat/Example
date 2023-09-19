import type { IHistogramComponentProps } from "./histogramComponent.types";
import { useCallback, useMemo, useRef } from "react";
import { handleCalculateMath } from "@im/dashboard/src/widgets/embeddedWidgets/utils/charts/CartesianCalculateMath";
import {
  CartesianSizeMath,
  type TMathSettings,
} from "@im/dashboard/src/widgets/embeddedWidgets/utils/charts/CartesianSizeMath";
import { ELegendPosition } from "@im/dashboard/src/widgets/embeddedWidgets/settings/charts.types";
import { useGetXAxis } from "./hooks/useGetXAxis";
import { useTheme } from "@infomaximum/base/src";
import { useGetYAxis } from "./hooks/useGetYAxis";
import {
  axisLineConfigObject,
  getBarInfo,
  getStrokeWidthDependingOnScaleOfBrowserWindow,
  getColorByIndex,
} from "@im/dashboard/src/widgets/embeddedWidgets/utils/charts/charts";
import { BarChart, CartesianGrid, ReferenceLine, Tooltip } from "recharts";
import { getCartesianGridStyleByPaddings } from "@im/dashboard/src/widgets/embeddedWidgets/styles/charts/cartesianComponents.styles";
import { useGetHistogramBars } from "./hooks/useGetHistogramBars";
import { useElementRect } from "@im/dashboard/src/decorators/hooks/useElementRect";
import {
  histogramChartContainerStyle,
  histogramComponentWrapperStyle,
} from "./histogramComponent.style";
import { CustomCursor } from "@im/dashboard/src/widgets/embeddedWidgets/entities/barChart/view/components/CustomCursor/CustomCursor";
import { tooltipWrapperHiddenStyle } from "@im/dashboard/src/widgets/embeddedWidgets/entities/barChart/view/BarChartWidget.styles";
import ChartPopupMenu from "../cartesianComponents/ChartPopupMenu/ChartPopupMenu";
import { noop } from "lodash";
import { useRelativePosition } from "@im/dashboard/src/decorators/hooks/useRelativePosition";

export const HistogramComponent: React.FC<IHistogramComponentProps> = ({
  converter,
  xAxisSettings,
  yAxisSettings,
  textSize,
  color: propColor,
  selectedBins,
  children,
  onBarClick: handleBarClick,
  denySelection = noop,
  clearSelection = noop,
  isShowPopupMenu = false,
  rootViewContainer,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerSize = useElementRect(containerRef.current);
  const relativePosition = useRelativePosition(containerRef.current, rootViewContainer);
  const { width: containerWidth, height: containerHeight } = containerSize;
  const color = propColor ? propColor : getColorByIndex(0);

  const theme = useTheme();
  const math = useMemo(() => {
    if (converter) {
      const settings: TMathSettings = {
        textSize,
        xAxis: xAxisSettings,
        yAxis: yAxisSettings,
        legend: { position: ELegendPosition.NONE },
        valueLabels: { enabled: false, showTotal: false },
      };
      // в отличии от barWidget нужен только один обсчет, т.к. мы точно знаем, что меток в гистограмме нет
      return handleCalculateMath(
        new CartesianSizeMath(settings, converter, containerWidth, containerHeight)
      );
    }
    return null;
  }, [containerHeight, containerWidth, converter, textSize, xAxisSettings, yAxisSettings]);

  const xAxis = useGetXAxis(converter, math, theme);
  const yAxis = useGetYAxis(converter, math, theme);
  const getBars = useGetHistogramBars({ converter, color, selectedBins });

  const getComponentContent = useCallback(() => {
    if (!converter || !converter.isCorrect() || !math) {
      return null;
    }

    const strokeWidth = 1;

    const x1Data = converter.getX1Data();
    const y1Data = converter.getY1Data();

    const { barSize, barGap } = getBarInfo(math);

    return (
      <>
        <ChartPopupMenu
          selection={selectedBins}
          clearSelection={clearSelection}
          containerSize={containerSize}
          denySelection={denySelection}
          portalContainer={rootViewContainer}
          relativePosition={relativePosition}
          show={isShowPopupMenu}
        />
        <BarChart
          width={containerWidth}
          height={containerHeight}
          data={converter.getChartData()}
          margin={math.margin}
          onClick={handleBarClick}
          layout={"horizontal"}
          barSize={barSize}
          barGap={barGap}
          css={getCartesianGridStyleByPaddings(math)}
        >
          <CartesianGrid
            vertical={false}
            horizontal={math.y1Axis.isShowTicks ? axisLineConfigObject : false}
            stroke={theme.grey4Color}
          />
          {!!x1Data && xAxis}
          {!!y1Data && yAxis}
          <ReferenceLine
            y={0}
            stroke={theme.grey6Color}
            shapeRendering="crispEdges"
            strokeWidth={getStrokeWidthDependingOnScaleOfBrowserWindow(strokeWidth)}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={<CustomCursor math={math} />}
            wrapperStyle={tooltipWrapperHiddenStyle}
            content={undefined}
          />
          {getBars()}
        </BarChart>
      </>
    );
  }, [
    converter,
    math,
    selectedBins,
    clearSelection,
    containerSize,
    denySelection,
    rootViewContainer,
    relativePosition,
    isShowPopupMenu,
    containerWidth,
    containerHeight,
    handleBarClick,
    theme.grey4Color,
    theme.grey6Color,
    xAxis,
    yAxis,
    getBars,
  ]);

  return (
    <div css={histogramComponentWrapperStyle}>
      <div ref={containerRef} css={histogramChartContainerStyle}>
        {!containerWidth || !containerHeight ? null : getComponentContent()}
      </div>
      <div css={{ marginLeft: `${math?.y1Axis.width}px` }}>
        {converter && math && converter.isCorrect() && children}
      </div>
    </div>
  );
};
