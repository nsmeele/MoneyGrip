export type FormMode =
  | { status: 'idle' }
  | { status: 'adding' }
  | { status: 'editing'; id: string };
