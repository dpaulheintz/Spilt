/** Clearly fictional sample rows for the /admin preview. Every person
 *  and company here is made up; addresses use example.com. */

export type InquiryStatus = "New" | "Contacted" | "In talks" | "Signed" | "Passed";

export type SampleInquiry = {
  id: string;
  receivedAt: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  interests: string[];
  status: InquiryStatus;
};

export const SAMPLE_INQUIRIES: SampleInquiry[] = [
  {
    id: "inq-1",
    receivedAt: "2026-10-18T14:12:00-04:00",
    name: "Jordan Ellis",
    organization: "Harbor & Vine Coffee",
    email: "jordan@harborandvine.example.com",
    phone: "(614) 555-0142",
    interests: ["move-and-mingle", "move-fest"],
    status: "New",
  },
  {
    id: "inq-2",
    receivedAt: "2026-10-15T09:47:00-04:00",
    name: "Priya Raman",
    organization: "Northbank Legal Group",
    email: "praman@northbanklegal.example.com",
    phone: "(614) 555-0187",
    interests: ["business-hop", "founders-fair"],
    status: "Contacted",
  },
  {
    id: "inq-3",
    receivedAt: "2026-10-09T17:30:00-04:00",
    name: "Marcus Webb",
    organization: "Lantern Ridge Ventures",
    email: "marcus@lanternridge.example.com",
    phone: "(380) 555-0119",
    interests: ["founders-fair", "tapt"],
    status: "In talks",
  },
];

export type SampleSubscriber = {
  email: string;
  name: string;
  joined: string;
  source: string;
};

export const SAMPLE_LISTS: Record<
  "main" | "donors",
  { label: string; count: number; rows: SampleSubscriber[] }
> = {
  main: {
    label: "Main",
    count: 1284,
    rows: [
      { email: "avery.k@example.com", name: "Avery Kim", joined: "2026-10-19", source: "Website" },
      { email: "sam.ortiz@example.com", name: "Sam Ortiz", joined: "2026-10-17", source: "Website" },
      { email: "dana.b@example.com", name: "Dana Brooks", joined: "2026-10-12", source: "Posh import" },
      { email: "lee.n@example.com", name: "Lee Nguyen", joined: "2026-10-04", source: "Website" },
      { email: "riley.m@example.com", name: "Riley Moss", joined: "2026-09-28", source: "Founders Fair" },
      { email: "casey.j@example.com", name: "Casey Jordan", joined: "2026-09-21", source: "Posh import" },
    ],
  },
  donors: {
    label: "Donors",
    count: 86,
    rows: [
      { email: "morgan.p@example.com", name: "Morgan Price", joined: "2026-10-02", source: "Move Fest" },
      { email: "taylor.r@example.com", name: "Taylor Reed", joined: "2026-09-14", source: "CSV import" },
      { email: "quinn.a@example.com", name: "Quinn Alvarez", joined: "2026-08-30", source: "CSV import" },
    ],
  },
};
