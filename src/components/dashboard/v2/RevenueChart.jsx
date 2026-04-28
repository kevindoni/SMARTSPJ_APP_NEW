import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatRupiah } from '../../../utils/transactionHelpers';
import { TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export default function RevenueChart({ data, year, title, onNavigateToBku }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-full flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
          <TrendingUp size={20} className="text-slate-300" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500">Belum Ada Data Arus Kas</p>
          <p className="text-xs text-slate-400 mt-1">Data akan muncul setelah ada transaksi</p>
        </div>
      </div>
    );
  }

  const months = data.map((d) => MONTH_NAMES_SHORT[parseInt(d.bulan) - 1] || d.bulan);
  const penerimaan = data.map((d) => d.penerimaan || 0);
  const pengeluaran = data.map((d) => d.pengeluaran || 0);
  const saldoAkhir = data.map((d) => d.saldo_akhir || 0);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Penerimaan',
        data: penerimaan,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: 'white',
        pointBorderColor: 'rgb(59, 130, 246)',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        pointHoverBackgroundColor: 'rgb(59, 130, 246)',
        fill: true,
        tension: 0.4,
        order: 2,
      },
      {
        label: 'Pengeluaran',
        data: pengeluaran,
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: 'white',
        pointBorderColor: 'rgb(251, 146, 60)',
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        pointHoverBackgroundColor: 'rgb(251, 146, 60)',
        fill: false,
        tension: 0.4,
        order: 2,
      },
      {
        label: 'Saldo Akhir',
        data: saldoAkhir,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [6, 3],
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'rgb(16, 185, 129)',
        fill: false,
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onClick: (event, elements) => {
      if (elements.length > 0 && onNavigateToBku) {
        const idx = elements[0].index;
        const monthNum = data[idx]?.bulan;
        if (monthNum) onNavigateToBku(monthNum);
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          font: { size: 11, weight: '500' },
          color: '#64748b',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        cornerRadius: 8,
        usePointStyle: true,
        titleFont: { weight: 'bold', size: 12 },
        bodyFont: { size: 11 },
        callbacks: {
          title: function(tooltipItems) {
            if (tooltipItems.length > 0) {
              const idx = tooltipItems[0].dataIndex;
              const monthNum = parseInt(data[idx]?.bulan) || (idx + 1);
              return MONTH_NAMES_FULL[monthNum - 1] + ' ' + year;
            }
            return '';
          },
          label: function (context) {
            return ' ' + context.dataset.label + ': ' + formatRupiah(context.raw);
          },
        },
      },
      datalabels: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11, weight: '500' }, color: '#94a3b8' },
      },
      y: {
        position: 'left',
        grid: { color: '#f1f5f9', drawBorder: false },
        ticks: {
          font: { size: 10 },
          color: '#94a3b8',
          callback: (value) => {
            if (value >= 1000000000) return (value / 1000000000).toFixed(1).replace(/.0$/, '') + 'M';
            if (value >= 1000000) return (value / 1000000).toFixed(0) + 'jt';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'rb';
            return value;
          },
        },
        title: { display: true, text: 'Arus Kas', font: { size: 10, weight: '500' }, color: '#94a3b8' },
      },
      y1: {
        position: 'right',
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: 'rgb(16, 185, 129)',
          callback: (value) => {
            if (value >= 1000000000) return (value / 1000000000).toFixed(1).replace(/.0$/, '') + 'M';
            if (value >= 1000000) return (value / 1000000).toFixed(0) + 'jt';
            if (value >= 1000) return (value / 1000).toFixed(0) + 'rb';
            return value;
          },
        },
        title: { display: true, text: 'Saldo Akhir', font: { size: 10, weight: '500' }, color: 'rgb(16, 185, 129)' },
      },
    },
    onHover: (event, elements) => {
      const canvas = event.native?.target;
      if (canvas) canvas.style.cursor = elements.length > 0 && onNavigateToBku ? 'pointer' : 'default';
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title || 'Arus Kas'}</h3>
          <p className="text-[11px] text-slate-400">Periode {year}</p>
        </div>
      </div>
      <div className="flex-1 min-h-[170px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}