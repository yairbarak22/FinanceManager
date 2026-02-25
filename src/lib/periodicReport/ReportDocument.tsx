import React from 'react';
import path from 'path';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type {
  PeriodicReportData,
  GoalStatus,
  AssetBreakdownItem,
  LiabilityBreakdownItem,
  TradingPortfolioData,
} from './types';
import { prepareRtl, formatILS, formatPercent } from './rtlUtils';

// ---------------------------------------------------------------------------
// Font Registration
// ---------------------------------------------------------------------------

const FONT_DIR = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Heebo',
  fonts: [
    { src: path.join(FONT_DIR, 'Heebo-Regular.ttf'), fontWeight: 400 },
    { src: path.join(FONT_DIR, 'Heebo-Bold.ttf'), fontWeight: 700 },
  ],
});

Font.registerHyphenationCallback((word: string) => [word]);

// ---------------------------------------------------------------------------
// Design Tokens
// ---------------------------------------------------------------------------

const C = {
  black: '#1A1A2E',
  darkGrey: '#4A4A5A',
  mediumGrey: '#888888',
  lightGrey: '#E0E0E0',
  veryLightGrey: '#F5F5F5',
  cardBg: '#F8F9FA',
  positive: '#2E7D5B',
  negative: '#C0392B',
  accent: '#3A5BA0',
  white: '#FFFFFF',
  tableBorder: '#ECECEC',
  progressBg: '#E8E8E8',
} as const;

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------

const s = StyleSheet.create({
  page: {
    fontFamily: 'Heebo',
    fontSize: 9.5,
    color: C.black,
    paddingTop: 0,
    paddingBottom: 55,
    paddingHorizontal: 45,
    backgroundColor: C.white,
  },

  // ---- Header ----
  headerBanner: {
    backgroundColor: C.cardBg,
    marginHorizontal: -45,
    paddingHorizontal: 45,
    paddingTop: 32,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: { fontWeight: 700, fontSize: 14, color: C.accent },
  titleBlock: { alignItems: 'flex-end', flexShrink: 1 },
  title: { fontWeight: 700, fontSize: 13, color: C.black, textAlign: 'right' },
  meta: { fontSize: 8, color: C.mediumGrey, textAlign: 'right', marginTop: 3, alignSelf: 'stretch' as const },

  // ---- Section Title ----
  sectionWrap: { marginTop: 20 },
  sectionTitle: {
    fontWeight: 700,
    fontSize: 11,
    color: C.black,
    textAlign: 'right',
    marginBottom: 4,
  },
  sectionLine: {
    height: 1,
    backgroundColor: C.accent,
    marginBottom: 10,
  },

  // ---- Executive Summary ----
  cardRow: { flexDirection: 'row', marginBottom: 2 },
  card: {
    flex: 1,
    backgroundColor: C.cardBg,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  cardValueLg: { fontWeight: 700, fontSize: 20, textAlign: 'center' },
  cardValue: { fontWeight: 700, fontSize: 16, textAlign: 'center' },
  cardSub: { fontSize: 8, textAlign: 'center', marginTop: 2 },
  cardLabel: {
    fontSize: 7.5,
    color: C.mediumGrey,
    textAlign: 'center',
    marginTop: 6,
  },

  // ---- Table ----
  tblHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.tableBorder,
    paddingBottom: 5,
    marginBottom: 3,
  },
  tblRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.tableBorder,
  },
  tblHCell: { fontWeight: 700, fontSize: 8, color: C.darkGrey, textAlign: 'center' },
  tblCell: { fontSize: 9, textAlign: 'center' },
  tblCellBold: { fontWeight: 700, fontSize: 9, textAlign: 'center' },

  // ---- Two-Column Layout ----
  twoCols: { flexDirection: 'row' },
  col: { flex: 1, marginHorizontal: 6 },
  colTitle: {
    fontWeight: 700,
    fontSize: 10,
    color: C.accent,
    textAlign: 'right',
    paddingBottom: 4,
    borderBottomWidth: 0.75,
    borderBottomColor: C.accent,
    marginBottom: 5,
  },

  // ---- Expense Row ----
  expRow: { flexDirection: 'row', paddingVertical: 2.5 },
  expName: { fontSize: 8, color: C.darkGrey, textAlign: 'right', flex: 1 },
  expPct: { fontSize: 8, color: C.mediumGrey, width: 32, textAlign: 'center' },
  expAmt: { fontSize: 8, fontWeight: 700, width: 58, textAlign: 'left' },
  expCompRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 3,
    paddingRight: 4,
    gap: 10,
  },
  expCompText: { fontSize: 6.5, color: C.mediumGrey, textAlign: 'right' },

  // ---- Balance Sheet ----
  bsColHead: {
    fontWeight: 700,
    fontSize: 11,
    color: C.accent,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: C.accent,
    paddingBottom: 4,
    marginBottom: 4,
  },
  bsTotal: { fontWeight: 700, fontSize: 10, textAlign: 'right', marginBottom: 6 },
  bsGroup: { fontWeight: 700, fontSize: 9.5, color: C.darkGrey, textAlign: 'right', marginTop: 6, marginBottom: 3 },
  bsRow: { flexDirection: 'row', paddingVertical: 1.5, paddingRight: 10 },
  bsName: { fontSize: 8, color: C.darkGrey, textAlign: 'right', flex: 1 },
  bsVal: { fontSize: 8, width: 65, textAlign: 'left' },
  bsSumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: C.lightGrey,
    paddingTop: 3,
    marginTop: 2,
  },
  bsSumLabel: { fontSize: 8, color: C.mediumGrey, textAlign: 'right' },
  bsSumVal: { fontWeight: 700, fontSize: 8, width: 65, textAlign: 'left' },
  netBar: {
    backgroundColor: C.veryLightGrey,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },

  // ---- Goals ----
  goalCard: {
    backgroundColor: C.cardBg,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalName: { fontWeight: 700, fontSize: 9.5, textAlign: 'right', flex: 1 },
  goalPct: { fontWeight: 700, fontSize: 9.5, color: C.accent, width: 40, textAlign: 'left' },
  progBg: { height: 5, backgroundColor: C.progressBg, borderRadius: 2.5, marginBottom: 6 },
  progFill: { height: 5, backgroundColor: C.accent, borderRadius: 2.5 },
  goalDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginTop: 2,
  },
  goalDetail: { fontSize: 7.5, color: C.darkGrey, textAlign: 'right' },
  goalStatus: { fontSize: 7.5, fontWeight: 700, textAlign: 'right' },
  projTxt: { fontSize: 9, color: C.darkGrey, textAlign: 'right' },
  projDetail: { fontSize: 8, color: C.mediumGrey, textAlign: 'right', marginTop: 2 },

  // ---- Footer ----
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 45,
    right: 45,
    borderTopWidth: 0.5,
    borderTopColor: C.lightGrey,
    paddingTop: 6,
  },
  footerTxt: { fontSize: 7, color: C.mediumGrey, textAlign: 'center' },

  // ---- Utility ----
  noData: { fontSize: 8, color: C.mediumGrey, textAlign: 'right' },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function valColor(v: number): string {
  if (v > 0) return C.positive;
  if (v < 0) return C.negative;
  return C.darkGrey;
}

function paceLabel(status: string): { text: string; color: string } {
  switch (status) {
    case 'completed':
      return { text: 'הושג!', color: C.positive };
    case 'ahead':
      return { text: 'מקדימ/ה את היעד', color: C.positive };
    case 'on_track':
      return { text: 'בקצב טוב', color: C.accent };
    case 'behind':
      return { text: 'מפגר/ת ביחס ליעד', color: C.negative };
    case 'no_recurring':
      return { text: 'ללא הפרשה חודשית', color: C.mediumGrey };
    default:
      return { text: '', color: C.mediumGrey };
  }
}

function formatProjectedDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  return new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    year: 'numeric',
  }).format(d);
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function SectionTitle({ title }: { title: string }) {
  return (
    <View>
      <Text style={s.sectionTitle}>{prepareRtl(title)}</Text>
      <View style={s.sectionLine} />
    </View>
  );
}

// ---- Header ----

function Header({ periodLabel }: { periodLabel: string }) {
  const d = new Date();
  const dateFormatted = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;

  const monthName = periodLabel.split(' ')[0] || periodLabel;

  const metaString = `הופק: ${dateFormatted}`;

  return (
    <View style={s.headerBanner} fixed>
      <View style={s.headerRow}>
        <Text style={s.brand}>myNETO</Text>
        <View style={s.titleBlock}>
          <Text style={s.title}>
            {prepareRtl(`תמונת מצב פיננסית - ${monthName}`)}
          </Text>
          <Text style={s.meta}>{metaString}</Text>
        </View>
      </View>
    </View>
  );
}

// ---- Executive Summary ----

function ExecutiveSummary({ data }: { data: PeriodicReportData }) {
  const momPct = data.monthOverMonth.netWorthChangePercent;
  let momText: string | undefined;
  let momColor: string | undefined;
  if (momPct !== null && momPct !== undefined) {
    momText = `${momPct >= 0 ? '▲' : '▼'} ${formatPercent(momPct)}`;
    momColor = momPct >= 0 ? C.positive : C.negative;
  }

  const cards: {
    label: string;
    value: string;
    color: string;
    large?: boolean;
    sub?: string;
    subColor?: string;
  }[] = [
    {
      label: 'תזרים נטו',
      value: formatILS(data.cashFlow.netCashflow),
      color: valColor(data.cashFlow.netCashflow),
    },
    {
      label: 'סה"כ התחייבויות',
      value: formatILS(data.totalLiabilities),
      color: C.darkGrey,
    },
    {
      label: 'סה"כ נכסים',
      value: formatILS(data.totalAssets),
      color: C.positive,
    },
    {
      label: 'הון עצמי נטו',
      value: formatILS(data.netWorth),
      color: valColor(data.netWorth),
      large: true,
      sub: momText,
      subColor: momColor,
    },
  ];

  return (
    <View style={s.sectionWrap} wrap={false}>
      <View style={s.cardRow}>
        {cards.map((c, i) => (
          <View key={i} style={s.card}>
            <Text style={[c.large ? s.cardValueLg : s.cardValue, { color: c.color }]}>
              {c.value}
            </Text>
            {c.sub && (
              <Text style={[s.cardSub, { color: c.subColor }]}>{c.sub}</Text>
            )}
            <Text style={s.cardLabel}>{prepareRtl(c.label)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---- Cash Flow Comparison ----

function calcDelta(
  current: number,
  prev: number | null,
  invertDelta: boolean
): { text: string; color: string } {
  if (prev === null || prev === 0) return { text: '—', color: C.mediumGrey };
  const delta = Math.round(((current - prev) / Math.abs(prev)) * 100);
  const color = invertDelta
    ? delta > 0
      ? C.negative
      : C.positive
    : delta >= 0
      ? C.positive
      : C.negative;
  return { text: formatPercent(delta), color };
}

function CashFlowTable({ data }: { data: PeriodicReportData }) {
  const cmp = data.cashFlowComparison;
  const rows = [
    {
      label: 'הכנסות',
      current: data.cashFlow.totalIncome,
      prevMonth: cmp.prevMonthIncome,
      lastYear: cmp.lastYearIncome,
      color: C.positive,
      invertDelta: false,
    },
    {
      label: 'הוצאות',
      current: data.cashFlow.totalExpenses,
      prevMonth: cmp.prevMonthExpenses,
      lastYear: cmp.lastYearExpenses,
      color: C.darkGrey,
      invertDelta: true,
    },
    {
      label: 'תזרים נקי',
      current: data.cashFlow.netCashflow,
      prevMonth: cmp.prevMonthCashflow,
      lastYear: cmp.lastYearCashflow,
      color: data.cashFlow.netCashflow >= 0 ? C.positive : C.negative,
      invertDelta: false,
    },
  ];

  return (
    <View style={s.sectionWrap} wrap={false}>
      <SectionTitle title="השוואת תזרים מזומנים" />

      <View style={s.tblHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.tblHCell}>{prepareRtl('שינוי')}</Text>
        </View>
        <View style={{ flex: 1.5 }}>
          <Text style={s.tblHCell}>{prepareRtl('תקופה מקבילה')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.tblHCell}>{prepareRtl('שינוי')}</Text>
        </View>
        <View style={{ flex: 1.5 }}>
          <Text style={s.tblHCell}>{prepareRtl('חודש קודם')}</Text>
        </View>
        <View style={{ flex: 1.5 }}>
          <Text style={s.tblHCell}>{prepareRtl('החודש')}</Text>
        </View>
        <View style={{ flex: 1.5 }}>
          <Text style={[s.tblHCell, { textAlign: 'right' }]}>{''}</Text>
        </View>
      </View>

      {rows.map((row, i) => {
        const prevDelta = calcDelta(row.current, row.prevMonth, row.invertDelta);
        const yearDelta = calcDelta(row.current, row.lastYear, row.invertDelta);

        return (
          <View key={i} style={s.tblRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.tblCell, { color: yearDelta.color, fontSize: 8 }]}>
                {yearDelta.text}
              </Text>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={[s.tblCell, { color: C.mediumGrey, fontSize: 8 }]}>
                {row.lastYear !== null ? formatILS(row.lastYear) : '—'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.tblCell, { color: prevDelta.color, fontSize: 8 }]}>
                {prevDelta.text}
              </Text>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={[s.tblCell, { color: C.mediumGrey, fontSize: 8 }]}>
                {row.prevMonth !== null ? formatILS(row.prevMonth) : '—'}
              </Text>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={[s.tblCellBold, { color: row.color }]}>
                {formatILS(row.current)}
              </Text>
            </View>
            <View style={{ flex: 1.5 }}>
              <Text style={[s.tblCellBold, { textAlign: 'right' }]}>
                {prepareRtl(row.label)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ---- Fixed vs Variable Income ----

function IncomeBreakdown({ data }: { data: PeriodicReportData }) {
  const hasFixed = data.fixedIncomeItems.length > 0;
  const hasVariable = data.variableIncomeItems.length > 0;
  if (!hasFixed && !hasVariable) return null;

  return (
    <View style={s.sectionWrap}>
      <SectionTitle title="פירוט הכנסות - קבועות ומשתנות" />
      <View style={s.twoCols}>
        <View style={s.col}>
          <Text style={s.colTitle}>{prepareRtl('הכנסות משתנות')}</Text>
          {data.variableIncomeItems.length === 0 ? (
            <Text style={s.noData}>{prepareRtl('אין נתונים')}</Text>
          ) : (
            data.variableIncomeItems.slice(0, 7).map((item, i) => {
              const prevDelta =
                item.prevMonthAmount !== null && item.prevMonthAmount > 0
                  ? Math.round(
                      ((item.amount - item.prevMonthAmount) / item.prevMonthAmount) * 100
                    )
                  : null;
              const yearDelta =
                item.lastYearAmount !== null && item.lastYearAmount > 0
                  ? Math.round(
                      ((item.amount - item.lastYearAmount) / item.lastYearAmount) * 100
                    )
                  : null;
              const hasComparison = prevDelta !== null || yearDelta !== null;

              return (
                <View key={i}>
                  <View style={s.expRow}>
                    <Text style={s.expAmt}>{formatILS(item.amount)}</Text>
                    <Text style={s.expPct}>{item.percentage}%</Text>
                    <Text style={s.expName}>{prepareRtl(item.name)}</Text>
                  </View>
                  {hasComparison && (
                    <View style={s.expCompRow}>
                      {prevDelta !== null && (
                        <Text
                          style={[
                            s.expCompText,
                            { color: prevDelta >= 0 ? C.positive : C.negative },
                          ]}
                        >
                          {formatPercent(prevDelta)}
                          {' :'}
                          {prepareRtl('חודש קודם')}
                        </Text>
                      )}
                      {yearDelta !== null && (
                        <Text
                          style={[
                            s.expCompText,
                            { color: yearDelta >= 0 ? C.positive : C.negative },
                          ]}
                        >
                          {formatPercent(yearDelta)}
                          {' :'}
                          {prepareRtl('שנה קודמת')}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
        <View style={s.col}>
          <Text style={s.colTitle}>{prepareRtl('הכנסות קבועות')}</Text>
          {data.fixedIncomeItems.length === 0 ? (
            <Text style={s.noData}>{prepareRtl('אין נתונים')}</Text>
          ) : (
            data.fixedIncomeItems.slice(0, 7).map((item, i) => (
              <View key={i} style={s.expRow}>
                <Text style={s.expAmt}>{formatILS(item.amount)}</Text>
                <Text style={s.expPct}>{item.percentage}%</Text>
                <Text style={s.expName}>{prepareRtl(item.name)}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

// ---- Fixed vs Variable Expenses ----

function ExpensesBreakdown({ data }: { data: PeriodicReportData }) {
  const hasFixed = data.fixedExpenseItems.length > 0;
  const hasVariable = data.variableExpenseItems.length > 0;
  if (!hasFixed && !hasVariable) return null;

  return (
    <View style={s.sectionWrap}>
      <SectionTitle title="פירוט הוצאות - קבועות ומשתנות" />
      <View style={s.twoCols}>
        <View style={s.col}>
          <Text style={s.colTitle}>{prepareRtl('הוצאות משתנות')}</Text>
          {data.variableExpenseItems.length === 0 ? (
            <Text style={s.noData}>{prepareRtl('אין נתונים')}</Text>
          ) : (
            data.variableExpenseItems.slice(0, 7).map((item, i) => {
              const prevDelta =
                item.prevMonthAmount !== null && item.prevMonthAmount > 0
                  ? Math.round(
                      ((item.amount - item.prevMonthAmount) / item.prevMonthAmount) * 100
                    )
                  : null;
              const yearDelta =
                item.lastYearAmount !== null && item.lastYearAmount > 0
                  ? Math.round(
                      ((item.amount - item.lastYearAmount) / item.lastYearAmount) * 100
                    )
                  : null;
              const hasComparison = prevDelta !== null || yearDelta !== null;

              return (
                <View key={i}>
                  <View style={s.expRow}>
                    <Text style={s.expAmt}>{formatILS(item.amount)}</Text>
                    <Text style={s.expPct}>{item.percentage}%</Text>
                    <Text style={s.expName}>{prepareRtl(item.name)}</Text>
                  </View>
                  {hasComparison && (
                    <View style={s.expCompRow}>
                      {prevDelta !== null && (
                        <Text
                          style={[
                            s.expCompText,
                            { color: prevDelta > 0 ? C.negative : C.positive },
                          ]}
                        >
                          {formatPercent(prevDelta)}
                          {' :'}
                          {prepareRtl('חודש קודם')}
                        </Text>
                      )}
                      {yearDelta !== null && (
                        <Text
                          style={[
                            s.expCompText,
                            { color: yearDelta > 0 ? C.negative : C.positive },
                          ]}
                        >
                          {formatPercent(yearDelta)}
                          {' :'}
                          {prepareRtl('שנה קודמת')}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
        <View style={s.col}>
          <Text style={s.colTitle}>{prepareRtl('הוצאות קבועות')}</Text>
          {data.fixedExpenseItems.length === 0 ? (
            <Text style={s.noData}>{prepareRtl('אין נתונים')}</Text>
          ) : (
            data.fixedExpenseItems.slice(0, 7).map((item, i) => (
              <View key={i} style={s.expRow}>
                <Text style={s.expAmt}>{formatILS(item.amount)}</Text>
                <Text style={s.expPct}>{item.percentage}%</Text>
                <Text style={s.expName}>{prepareRtl(item.name)}</Text>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

// ---- Balance Sheet ----

function BreakdownColumn({
  groups,
  accentColor,
}: {
  groups: AssetBreakdownItem[] | LiabilityBreakdownItem[];
  accentColor: string;
}) {
  if (groups.length === 0) {
    return <Text style={s.noData}>{prepareRtl('אין נתונים')}</Text>;
  }

  return (
    <>
      {groups.map((group, gi) => (
        <View key={gi}>
          <Text style={s.bsGroup}>{prepareRtl(group.groupNameHe)}</Text>
          {group.items.map((item, ii) => (
            <View key={ii} style={s.bsRow}>
              <Text style={s.bsVal}>{formatILS(item.value)}</Text>
              <Text style={s.bsName}>{prepareRtl(item.name)}</Text>
            </View>
          ))}
          <View style={s.bsSumRow}>
            <Text style={[s.bsSumVal, { color: accentColor }]}>
              {formatILS(group.total)}
            </Text>
            <Text style={s.bsSumLabel}>{prepareRtl('סה"כ')}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

function BalanceSheet({ data }: { data: PeriodicReportData }) {
  return (
    <View style={s.sectionWrap}>
      <SectionTitle title="מאזן מפורט" />
      <View style={s.twoCols}>
        <View style={s.col}>
          <Text style={s.bsColHead}>{prepareRtl('התחייבויות')}</Text>
          <Text style={[s.bsTotal, { color: C.negative }]}>
            {formatILS(data.totalLiabilities)}
          </Text>
          <BreakdownColumn groups={data.liabilityBreakdown} accentColor={C.negative} />
        </View>
        <View style={s.col}>
          <Text style={s.bsColHead}>{prepareRtl('נכסים')}</Text>
          <Text style={[s.bsTotal, { color: C.positive }]}>
            {formatILS(data.totalAssets)}
          </Text>
          <BreakdownColumn groups={data.assetBreakdown} accentColor={C.positive} />
        </View>
      </View>

      <View style={s.netBar}>
        <Text style={{ fontWeight: 700, fontSize: 11, color: valColor(data.netWorth) }}>
          {formatILS(data.netWorth)}
        </Text>
        <Text style={{ fontSize: 9, color: C.black, textAlign: 'right' }}>
          {' :'}
          {prepareRtl('שווי נקי')}
        </Text>
      </View>
    </View>
  );
}

// ---- Trading Portfolio ----

function TradingPortfolioSection({ data }: { data: PeriodicReportData }) {
  const { holdings, totalValue, hasHoldings, freeCashFlow } = data.tradingPortfolio;

  return (
    <View style={s.sectionWrap} wrap={false}>
      <SectionTitle title="תיק מסחר עצמאי" />

      {!hasHoldings ? (
        <View>
          <Text style={s.goalDetail}>
            {prepareRtl('כרגע אין לך השקעות בתיק מסחר עצמאי')}
          </Text>
          {freeCashFlow > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={s.goalDetail}>
                {formatILS(freeCashFlow)}
                {' '}
                {prepareRtl('יש לך תזרים פנוי של')}
              </Text>
              <Text style={s.goalDetail}>
                {prepareRtl('כדאי להשקיע אותו - למידע נוסף צפה בסדרת הסרטונים שלנו על השקעות')}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View>
          {holdings.map((h, i) => (
            <View key={i} style={s.bsRow}>
              <Text style={s.bsVal}>{formatILS(h.value)}</Text>
              <Text style={s.bsName}>{prepareRtl(h.name)}</Text>
            </View>
          ))}
          <View style={s.bsSumRow}>
            <Text style={[s.bsSumVal, { color: C.positive }]}>
              {formatILS(totalValue)}
            </Text>
            <Text style={s.bsSumLabel}>{prepareRtl('סה"כ תיק מסחר עצמאי')}</Text>
          </View>
          {freeCashFlow > 0 && (
            <View style={{ marginTop: 8 }}>
              <Text style={s.goalDetail}>
                {formatILS(freeCashFlow)}
                {' '}
                {prepareRtl('יש לך תזרים פנוי של')}
                {' - '}
                {prepareRtl('כדאי להשקיע אותו')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ---- Goals & Projections ----

function GoalsProjections({ data }: { data: PeriodicReportData }) {
  const hasGoals = data.goals.length > 0;
  const hasProj = data.projections.totalProjected > 0;
  if (!hasGoals && !hasProj) return null;

  return (
    <View style={s.sectionWrap}>
      <SectionTitle title="יעדים ותחזית" />

      {hasGoals &&
        data.goals.slice(0, 5).map((goal, i) => {
          const fill = Math.min(goal.percentage, 100);
          const pace = paceLabel(goal.status);

          return (
            <View key={i} style={s.goalCard} wrap={false}>
              <View style={s.goalHeader}>
                <Text style={s.goalPct}>{goal.percentage}%</Text>
                <Text style={s.goalName}>{prepareRtl(goal.name)}</Text>
              </View>

              <View style={s.progBg}>
                <View
                  style={[
                    s.progFill,
                    {
                      width: `${fill}%`,
                      alignSelf: 'flex-end',
                      backgroundColor:
                        goal.status === 'completed'
                          ? C.positive
                          : goal.status === 'behind'
                            ? C.negative
                            : C.accent,
                    },
                  ]}
                />
              </View>

              <View style={s.goalDetailsRow}>
                <Text style={[s.goalStatus, { color: pace.color }]}>
                  {prepareRtl(pace.text)}
                </Text>
                {goal.projectedCompletionDate && goal.status !== 'completed' && (
                  <Text style={s.goalDetail}>
                    {formatProjectedDate(goal.projectedCompletionDate)}
                    {' :'}
                    {prepareRtl('צפי הגעה')}
                  </Text>
                )}
                <Text style={s.goalDetail}>
                  {formatILS(goal.requiredMonthly)}
                  {' :'}
                  {prepareRtl('נדרש')}
                  {' / '}
                  {formatILS(goal.monthlyContribution)}
                  {' :'}
                  {prepareRtl('הפרשה')}
                </Text>
                <Text style={s.goalDetail}>
                  {goal.contributedThisMonth ? prepareRtl('כן') : prepareRtl('לא')}
                  {' :'}
                  {prepareRtl('הופרש החודש')}
                </Text>
              </View>

              <View style={[s.goalDetailsRow, { marginTop: 1 }]}>
                <Text style={s.goalDetail}>
                  {formatILS(goal.targetAmount)}
                  {' '}
                  {prepareRtl('מתוך')}
                  {' '}
                  {formatILS(goal.currentAmount)}
                </Text>
              </View>
            </View>
          );
        })}

      {hasProj && (
        <View style={{ marginTop: hasGoals ? 4 : 0 }}>
          <Text style={s.projTxt}>
            {formatILS(data.projections.totalProjected)}
            {' :'}
            {prepareRtl('צפי הוצאות קבועות לחודש הבא')}
          </Text>
          {data.projections.nextMonthLiabilityPayments > 0 && (
            <Text style={s.projDetail}>
              {formatILS(data.projections.nextMonthFixedExpenses)}
              {' :'}
              {prepareRtl('הוצאות קבועות')}
              {' | '}
              {formatILS(data.projections.nextMonthLiabilityPayments)}
              {' :'}
              {prepareRtl('מתוכם תשלומי הלוואות')}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ---- Footer ----

function ReportFooter() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerTxt}>
        {prepareRtl('דוח זה הוכן על ידי myNETO')}
      </Text>
      <Text style={[s.footerTxt, { marginTop: 4 }]}>
        {prepareRtl('דוח זה אינו מהווה ייעוץ פיננסי ואינו תחליף לייעוץ מקצועי')}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Document
// ---------------------------------------------------------------------------

interface ReportDocumentProps {
  data: PeriodicReportData;
}

export default function ReportDocument({ data }: ReportDocumentProps) {
  const hasGoalsOrProjections =
    data.goals.length > 0 || data.projections.totalProjected > 0;

  return (
    <Document
      title={`Financial Report - ${data.period.label}`}
      author="myneto"
      creator="myneto"
    >
      <Page size="A4" style={s.page} wrap>
        <Header periodLabel={data.period.label} />
        <ExecutiveSummary data={data} />
        <CashFlowTable data={data} />
        <IncomeBreakdown data={data} />
        <ExpensesBreakdown data={data} />
        <ReportFooter />
      </Page>

      <Page size="A4" style={s.page} wrap>
        <Header periodLabel={data.period.label} />
        <BalanceSheet data={data} />
        <TradingPortfolioSection data={data} />
        <ReportFooter />
      </Page>

      {hasGoalsOrProjections && (
        <Page size="A4" style={s.page} wrap>
          <Header periodLabel={data.period.label} />
          <GoalsProjections data={data} />
          <ReportFooter />
        </Page>
      )}
    </Document>
  );
}
