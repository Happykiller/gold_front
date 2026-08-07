// src\components\Layout\HeaderExt.tsx
import {
  Map,
  Language,
  Cloud,
  Email,
  BugReport,
  LightMode,
  DarkMode,
} from '@mui/icons-material';

import inversify from '@src/common/inversify';
import { Footer } from '@happykiller/sunny-ui';
import { contextStore } from '../store/contextStore';

export function FooterExt() {
  const mode = contextStore((s) => s.themeMode);
  const toggleTheme = contextStore((s) => s.toggleTheme);
  return (
    <Footer
      systemInfoUsecase={inversify.systemInfoUsecase}
      frontVersion={process.env.VERSION ?? '1.0.0'}
      issuesUrl="https://github.com/Happykiller/gold_front/issues"
      projectUrl="https://github.com/users/Happykiller/projects/2/views/1"
      mailto="fabrice.rosito@gmail.com"
      brandName="Gold"
      icons={{
        email: <Email fontSize="small" />,
        issues: <BugReport fontSize="small" />,
        roadmap: <Map fontSize="small" />,
        language: <Language fontSize="small" />,
        cloud: <Cloud fontSize="small" />,
      }}
      onToggleTheme={toggleTheme}
      iconThemeToggle={
        mode === 'dark' ? (
          <LightMode fontSize="small" />
        ) : (
          <DarkMode fontSize="small" />
        )
      }
    />
  );
}
