// App design system component library (Phase 6 — mirror of
// webapp-reset/DESIGN_SYSTEM_V1.md). Consumed against the `app` Tailwind token
// group under a `.theme-app` scope. The old `src/components/ui/*` primitives
// retire surface-by-surface as screens migrate here.
export { Button, buttonVariants } from './Button';
export type { IButtonProps } from './Button';
export { Input, Textarea, Select } from './Field';
export type { IInputProps, ITextareaProps, ISelectProps } from './Field';
export { Card } from './Card';
export type { ICardProps } from './Card';
export { Page, PageHeader, PageSection } from './Page';
export type { IPageProps, IPageHeaderProps, IPageSectionProps } from './Page';
export { EmptyState } from './EmptyState';
export type { IEmptyStateProps, IEmptyStateAction, IEmptyStateHint } from './EmptyState';
export { MetricGrid, MetricTile, DataList, DataItem } from './Data';
export type {
  IMetricGridProps,
  IMetricTileProps,
  IDataListProps,
  IDataItemProps,
} from './Data';
export { Form, FormSection, FormRow, FormActions } from './Form';
export type {
  IFormProps,
  IFormSectionProps,
  IFormRowProps,
  IFormActionsProps,
} from './Form';
export { ChipGroup, TokenSelect } from './MultiSelect';
export type { IChipGroupProps, ITokenSelectProps } from './MultiSelect';
export { ChoiceCard, ChoiceCardGroup } from './ChoiceCard';
export type { IChoiceCardProps } from './ChoiceCard';
export { ProviderButton } from './ProviderButton';
export type { IProviderButtonProps, OAuthProvider } from './ProviderButton';
export { GoogleIcon, GitHubIcon } from './BrandIcons';
export type { IBrandIconProps } from './BrandIcons';
export { Alert } from './Alert';
export type { IAlertProps } from './Alert';
export {
  StatusPill,
  VerificationBadge,
  TrustScore,
  DeliveryConfidence,
  DecisionAttribution,
} from './Trust';
export type {
  IStatusPillProps,
  StatusState,
  IVerificationBadgeProps,
  VerificationState,
  ITrustScoreProps,
  IDeliveryConfidenceProps,
  IDecisionAttributionProps,
} from './Trust';
export { NavItem } from './Nav';
export type { INavItemProps } from './Nav';
export { AppShell, isNavActive } from './AppShell';
export type { IAppShellProps, IAppNavSpec } from './AppShell';
export { Table, THead, TH, TR, TD } from './Table';
export type { ITableProps } from './Table';
export { Tabs, Tab } from './Tabs';
export type { ITabProps } from './Tabs';
export { Modal } from './Modal';
export type { IModalProps } from './Modal';
