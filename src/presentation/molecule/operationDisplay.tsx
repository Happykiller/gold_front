// src\presentation\molecule\operationDisplay.tsx
import dayjs from 'dayjs';
import React from 'react';
import { JSX } from 'react';
import WifiIcon from '@mui/icons-material/Wifi';
import WorkIcon from '@mui/icons-material/Work';
import HouseIcon from '@mui/icons-material/House';
import GavelIcon from '@mui/icons-material/Gavel';
import MouseIcon from '@mui/icons-material/Mouse';
import ShieldIcon from '@mui/icons-material/Shield';
import BalanceIcon from '@mui/icons-material/Balance';
import PaymentsIcon from '@mui/icons-material/Payments';
import CategoryIcon from '@mui/icons-material/Category';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CelebrationIcon from '@mui/icons-material/Celebration';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import EmojiTransportationIcon from '@mui/icons-material/EmojiTransportation';

import { Operation } from '@presentation/hooks/useAccountOperations';

export function getCategoryIcon(categoryLabel: string) {
  const label = categoryLabel?.trim().toLowerCase();

  const map: Record<string, { icon: JSX.Element; color: string }> = {
    'alimentation': {
      icon: <LocalDiningIcon />,
      color: '#ff9800',
    },
    'santé': {
      icon: <HealthAndSafetyIcon />,
      color: '#ef5350',
    },
    'cadeau': {
      icon: <CardGiftcardIcon />,
      color: '#f06292',
    },
    'prêt': {
      icon: <PaymentsIcon />,
      color: '#9575cd',
    },
    'mobilité': {
      icon: <EmojiTransportationIcon />,
      color: '#4fc3f7',
    },
    'vacances': {
      icon: <BeachAccessIcon />,
      color: '#4db6ac',
    },
    'illidan': {
      icon: <ChildCareIcon />,
      color: '#ba68c8',
    },
    'enfant': {
      icon: <ChildCareIcon />,
      color: '#ba68c8',
    },
    'fabrice': {
      icon: <FavoriteIcon />,
      color: '#ff4081',
    },
    'frais': {
      icon: <PaymentsIcon />,
      color: '#8d6e63',
    },
    'sortie': {
      icon: <CelebrationIcon />,
      color: '#ffb74d',
    },
    'revenue': {
      icon: <TrendingUpIcon />,
      color: '#66bb6a',
    },
    'régulation': {
      icon: <BalanceIcon />,
      color: '#90a4ae',
    },
    'jeux': {
      icon: <SportsEsportsIcon />,
      color: '#7986cb',
    },
    'impôts': {
      icon: <GavelIcon />,
      color: '#ff7043',
    },
    'fai': {
      icon: <WifiIcon />,
      color: '#26a69a',
    },
    'immobilier': {
      icon: <HouseIcon />,
      color: '#4db6ac',
    },
    'salaire': {
      icon: <WorkIcon />,
      color: '#00c853',
    },
    'assurance': {
      icon: <ShieldIcon />,
      color: '#607d8b',
    },
    'charges': {
      icon: <CreditCardIcon />,
      color: '#b388ff',
    },
    'geek': {
      icon: <MouseIcon />,
      color: '#67b7ff',
    },
  };

  const match = map[label ?? ''];

  if (match) {
    return React.cloneElement(match.icon, {
      sx: {
        color: match.color,
        fontSize: 20,
        mr: 0.5,
        verticalAlign: 'middle',
      },
    });
  }

  return (
    <CategoryIcon
      sx={{
        color: '#a9b1c2',
        fontSize: 20,
        mr: 0.5,
        verticalAlign: 'middle',
      }}
    />
  );
}

export function getOperationIcon(amount: number) {
  if (amount < 0) return <TrendingDownIcon sx={{ color: '#ff5f5f', fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />;
  if (amount > 0) return <TrendingUpIcon sx={{ color: '#23e47a', fontSize: 18, verticalAlign: 'middle', mr: 0.5 }} />;
  return null;
}

export function getVisualAmountMeta(operation: Operation, currentAccountId: number) {
  const baseAmount = operation.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €';

  if (operation.type_id === 1) {
    return { sign: '+', color: '#23e47a', value: `+${baseAmount}` }; // Crédit
  }

  if (operation.type_id === 2) {
    return { sign: '-', color: '#ff5f5f', value: `-${baseAmount}` }; // Débit
  }

  if (operation.type_id === 3) {
    if (operation.account_id_dest === currentAccountId) {
      return { sign: '+', color: '#40a9ff', value: `+${baseAmount}` }; // Virement reçu
    } else {
      return { sign: '-', color: '#b388ff', value: `-${baseAmount}` }; // Virement envoyé
    }
  }

  return { sign: '', color: '#ccc', value: baseAmount }; // Fallback
}

export function formatOperationDate(date: string) {
  return dayjs(parseInt(date)).format('DD/MM/YYYY');
}
