// Pipeline node type definitions for the React Flow visual editor

export enum PipelineNodeType {
  SOURCE = 'source',
  FILTER = 'filter',
  GROUP_BY = 'groupBy',
  AGGREGATE = 'aggregate',
  CALCULATE = 'calculate',
  SORT = 'sort',
  OUTPUT = 'output',
}

export enum AggregateFunction {
  SUM = 'sum',
  AVG = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  CUMSUM = 'cumsum',
}

export enum FilterOperator {
  EQUALS = '=',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_THAN_OR_EQUAL = '>=',
  LESS_THAN_OR_EQUAL = '<=',
  IN = 'in',
  BETWEEN = 'between',
}

export enum OutputChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  NUMBER = 'number',
  TABLE = 'table',
  AREA = 'area',
  DONUT = 'donut',
}

export interface SourceNodeConfig {
  type: PipelineNodeType.SOURCE;
}

export interface FilterNodeConfig {
  type: PipelineNodeType.FILTER;
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface GroupByNodeConfig {
  type: PipelineNodeType.GROUP_BY;
  field: string;
}

export interface AggregateNodeConfig {
  type: PipelineNodeType.AGGREGATE;
  function: AggregateFunction;
  field: string;
}

export interface CalculateNodeConfig {
  type: PipelineNodeType.CALCULATE;
  expression: string;
}

export interface SortNodeConfig {
  type: PipelineNodeType.SORT;
  field: string;
  direction: 'asc' | 'desc';
}

export interface OutputNodeConfig {
  type: PipelineNodeType.OUTPUT;
  chartType: OutputChartType;
  xAxis?: string;
  yAxis?: string;
  title?: string;
}

export type PipelineNodeConfig =
  | SourceNodeConfig
  | FilterNodeConfig
  | GroupByNodeConfig
  | AggregateNodeConfig
  | CalculateNodeConfig
  | SortNodeConfig
  | OutputNodeConfig;
