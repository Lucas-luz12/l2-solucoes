export type ProposalStatus =
  | "rascunho"
  | "enviada"
  | "visualizada"
  | "aceita"
  | "recusada"
  | "expirada";

export type Company = {
  name: string;
  document: string;
  email: string;
  phone: string;
  city: string;
  pix: string;
  site: string;
};

export type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  createdAt: string;
};

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type Proposal = {
  id: string;
  number: string;
  token: string;
  clientId: string;
  title: string;
  summary: string;
  items: LineItem[];
  discountPercent: number;
  validityDays: number;
  validUntil: string | null;
  paymentTerms: string;
  notes: string;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  responseName: string | null;
  responseNote: string | null;
  privacyAcceptedAt?: string | null;
};

export type Operator = {
  email: string;
  passwordHash: string;
  passwordSalt: string;
};

export type Workspace = {
  company: Company;
  clients: Client[];
  proposals: Proposal[];
  operator?: Operator;
};

export type ClientInput = {
  id?: string | null;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
};

export type ProposalItemInput = {
  description: string;
  quantity: number;
  unitPriceCents: number;
};

export type ProposalInput = {
  id?: string | null;
  clientId: string;
  title: string;
  summary: string;
  items: ProposalItemInput[];
  discountPercent: number;
  validityDays: number;
  paymentTerms: string;
  notes: string;
};

export type PublicProposal = {
  company: Company;
  client: Pick<Client, "name" | "company" | "city">;
  proposal: Proposal;
};
