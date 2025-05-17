import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CategoryIcon from '@mui/icons-material/Category';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import dayjs from 'dayjs';

// Catégorie → icône + couleur
export function getCategoryIcon(categoryLabel: string) {
  switch (categoryLabel?.toLowerCase()) {
    case 'voyage':
      return <TravelExploreIcon sx={{ color: '#40a9ff', fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />;
    case 'geek':
      return <CategoryIcon sx={{ color: '#67b7ff', fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />;
    case 'revenus':
      return <AttachMoneyIcon sx={{ color: '#00c853', fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />;
    case 'loisirs':
      return <LocalOfferIcon sx={{ color: '#f89b36', fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />;
    case 'charges':
      return <CreditCardIcon sx={{ color: '#b388ff', fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />;
    case 'maison':
      return <HomeWorkIcon sx={{ color: '#6be7ff', fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />;
    default:
      return <CategoryIcon sx={{ color: '#a9b1c2', fontSize: 20, mr: 0.5, verticalAlign: 'middle' }} />;
  }
}

export function getAmountColor(amount: number, theme: any) {
  if (amount < 0) return theme.palette.error.main;
  if (amount > 0) return theme.palette.success.main;
  return theme.palette.text.primary;
}

export function getOperationIcon(amount: number) {
  if (amount < 0) return <TrendingDownIcon sx={{ color: '#ff5f5f', fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />;
  if (amount > 0) return <TrendingUpIcon sx={{ color: '#23e47a', fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />;
  return null;
}

export function formatOperationDate(date: string) {
  return dayjs(date).format('DD/MM/YYYY');
}
