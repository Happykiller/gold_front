// src\components\Layout\LayoutProtectedExt.tsx
import { LayoutProtected } from '@happykiller/sunny-ui';
import { HeaderExt } from '@components/layout/HeaderExt';
import { FooterExt } from '@components/layout/FooterExt';
import inversify from '@src/common/inversify';
import { contextStore } from '../store/contextStore';

export function LayoutProtectedExt({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProtected
      header={<HeaderExt />}
      footer={<FooterExt />}
      sessionInfoUsecase={inversify.sessionInfo}
      loggerService={inversify.loggerService}
      contextStore={contextStore}
    >
      {children}
    </LayoutProtected>
  );
}
