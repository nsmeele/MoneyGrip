export enum RenteType {
  Enkelvoudig = 'enkelvoudig',
  Samengesteld = 'samengesteld',
}

export const RENTE_TYPE_LABELS: Record<RenteType, string> = {
  [RenteType.Enkelvoudig]: 'Enkelvoudig',
  [RenteType.Samengesteld]: 'Rente op rente',
};
