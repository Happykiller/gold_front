import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import Highcharts from 'highcharts';
// Import nommé volontaire : `highcharts-react-official` est un bundle UMD
// ancien, et Vite en pré-bundle l'objet module entier comme export par défaut
// (`export default require_highcharts_react_min()`). Un import par défaut
// récupère donc `{ HighchartsReact, default }` au lieu du composant, ce que
// React refuse de rendre — « Element type is invalid… got: object ».
import { HighchartsReact } from 'highcharts-react-official';
import inversify from '@src/common/inversify';
import { GetAccountsUsecaseModel } from '@usecase/getAccounts/getAccounts.usecase.model';
import { PageShell } from '@presentation/molecule/pageShell';
import { AsyncState } from '@presentation/molecule/asyncState';
import { chartTheme, chartSumSeriesStyle } from '@src/theme/highcharts';
import { LINE } from '@src/theme/tokens';

export const Graphic: React.FC = () => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<GetAccountsUsecaseModel | null>(
    null,
  );
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    dayjs().subtract(1, 'month'),
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
  const [displayMode, setDisplayMode] = useState<'reconciled' | 'all'>('all');
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await inversify.getAccountsUsecase.execute();
        if (response.data) {
          setAccounts(response);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAccounts();
  }, []);

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  // MUI 9 : PaperProps est remplacé par slotProps.paper.
  const MenuProps = {
    slotProps: {
      paper: {
        style: {
          maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
          width: 250,
        },
      },
    },
  };

  const handleAccountChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setSelectedAccounts(
      typeof value === 'string' ? value.split(',').map(Number) : value,
    );
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    if (startDate.isAfter(endDate)) {
      setError(t('graphic.dateRangeError'));
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Call the new getCashflow usecase
      const response = await inversify.getCashflowUsecase.execute({
        account_ids:
          selectedAccounts.length > 0
            ? selectedAccounts
            : accounts?.data?.map((a) => a.id) || [],
        start_date: startDate.format('YYYY-MM-DD'),
        end_date: endDate.format('YYYY-MM-DD'),
      });

      if (response.data) {
        setChartData(response.data);
      } else {
        inversify.loggerService.debug(response.error);
        setError(response.message);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const uniqueDates = Array.from(new Set(chartData.map((d) => d.date))).sort();

  const options = {
    ...chartTheme,
    chart: { ...chartTheme.chart, type: 'area' },
    title: { text: undefined },
    xAxis: {
      ...chartTheme.xAxis,
      categories: uniqueDates.map((d) =>
        dayjs(d as string, 'YYYY-MM-DD').format('DD/MM/YYYY'),
      ),
      tickmarkPlacement: 'on',
      title: { enabled: false },
    },
    yAxis: {
      ...chartTheme.yAxis,
      title: { text: t('operation.amount') },
      labels: {
        formatter: function (this: any) {
          return this.value;
        },
      },
    },
    tooltip: {
      ...chartTheme.tooltip,
      split: true,
      valueSuffix: ' €',
    },
    plotOptions: {
      area: {
        lineWidth: 1,
        marker: { lineWidth: 1 },
      },
    },
    series: [] as any[],
  };

  const groupedData = chartData.reduce((acc: any, curr: any) => {
    if (!acc[curr.account_id]) acc[curr.account_id] = [];
    acc[curr.account_id].push(curr);
    return acc;
  }, {});

  Object.keys(groupedData).forEach((accountIdStr) => {
    const accId = parseInt(accountIdStr, 10);
    const accountLabel =
      accounts?.data?.find((a) => a.id === accId)?.label ?? String(accId);
    const accData = groupedData[accId];

    const dataMap = new Map<string, any>(accData.map((d: any) => [d.date, d]));

    const reconciledData = uniqueDates.map((date) => {
      const d = dataMap.get(date as string);
      return d ? parseFloat(d.reconciled_balance) : 0;
    });

    const totalData = uniqueDates.map((date) => {
      const d = dataMap.get(date as string);
      return d ? parseFloat(d.total_balance) : 0;
    });

    if (displayMode === 'reconciled') {
      options.series.push({
        name: `${accountLabel}`,
        data: reconciledData,
        fillOpacity: 0.3,
      });
    } else {
      options.series.push({
        name: `${accountLabel}`,
        data: totalData,
        fillOpacity: 0.3,
      });
    }
  });

  if (options.series.length > 0) {
    const sumData = uniqueDates.map((_, index) => {
      return options.series.reduce(
        (sum: number, seriesEntry: { data: number[] }) =>
          sum + (seriesEntry.data[index] || 0),
        0,
      );
    });

    // We add the sum as an area chart.
    // We set stacking to undefined for this specific series because the other series are already stacked ('normal').
    // If we stacked this one as well, it would double the total height of the graph.
    // It will perfectly overlap the top edge of the stack (which is the mathematical total).
    options.series.push({
      type: 'spline',
      name: t('graphic.sumSeries'),
      data: sumData,
      ...chartSumSeriesStyle,
    });
  }

  return (
    <PageShell
      title={t('graphic.title')}
      width="full"
      actions={
        <Button
          variant="contained"
          size="small"
          onClick={handleGenerate}
          disabled={loading}
        >
          {t('graphic.generate')}
        </Button>
      }
    >
      <Box
        sx={{
          display: 'flex',
          gap: '14px',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          pb: '14px',
          mb: '14px',
          borderBottom: LINE.block,
        }}
      >
        <FormControl variant="standard" sx={{ minWidth: 260, flex: 1 }}>
          <InputLabel id="accounts-label">{t('graphic.accounts')}</InputLabel>
          <Select
            labelId="accounts-label"
            id="accounts-select"
            multiple
            variant="standard"
            value={selectedAccounts}
            onChange={handleAccountChange}
            renderValue={(selected) =>
              selected
                .map(
                  (id) => accounts?.data?.find((a) => a.id === id)?.label ?? id,
                )
                .join(', ')
            }
            MenuProps={MenuProps}
          >
            {accounts?.data?.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                <Checkbox
                  size="small"
                  checked={selectedAccounts.indexOf(account.id) > -1}
                />
                <ListItemText primary={account.label} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label={t('graphic.startDate')}
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          format="DD/MM/YYYY"
          slotProps={{ textField: { variant: 'standard' } }}
        />
        <DatePicker
          label={t('graphic.endDate')}
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          format="DD/MM/YYYY"
          slotProps={{ textField: { variant: 'standard' } }}
        />

        <FormControl variant="standard" sx={{ minWidth: 190 }}>
          <InputLabel id="display-mode-label">
            {t('graphic.filterMode')}
          </InputLabel>
          <Select
            labelId="display-mode-label"
            variant="standard"
            value={displayMode}
            onChange={(e) =>
              setDisplayMode(e.target.value as 'reconciled' | 'all')
            }
          >
            <MenuItem value="all">{t('graphic.filterAll')}</MenuItem>
            <MenuItem value="reconciled">
              {t('graphic.filterReconciled')}
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      <AsyncState
        loading={loading}
        error={error}
        namespace="graphic"
        isEmpty={chartData.length === 0}
        empty={t('graphic.empty')}
      >
        <HighchartsReact highcharts={Highcharts} options={options} />
      </AsyncState>
    </PageShell>
  );
};

export default Graphic;
