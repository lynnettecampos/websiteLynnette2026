import type { Client } from "@/content/clients";
import { CLIENTS } from "@/content/clients";
import { mergeFallbackRecordsUntilInitialized } from "@/data/content-bootstrap";
import { hasDatabaseConfig } from "@/lib/env";
import { createResilientContentReader } from "@/data/resilient-read";
import {
  fetchClientsFromDatabase,
  isClientsCollectionInitialized,
} from "@/server/clients";


const filterPrivate = (clients: Client[], includePrivate: boolean) =>
  includePrivate ? clients : clients.filter((client) => !client.isPrivate);

const sortClients = (clients: Client[]) =>
  [...clients].sort((first, second) => {
    const orderDifference =
      (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER);
    return orderDifference || first.name.localeCompare(second.name);
  });

const getClientsFallback = (includePrivate: boolean): Client[] =>
  filterPrivate(sortClients(CLIENTS), includePrivate);

export const getClientsFromDatabase = async (includePrivate: boolean): Promise<Client[]> => {
  const [clients, initialized] = await Promise.all([
    fetchClientsFromDatabase(),
    isClientsCollectionInitialized(),
  ]);

  const resolvedClients = mergeFallbackRecordsUntilInitialized(CLIENTS, clients, initialized);
  return filterPrivate(sortClients(resolvedClients), includePrivate);
};

const readPublicClients = createResilientContentReader("clients", () =>
  getClientsFallback(false),
);
const readAllClients = createResilientContentReader("clients:admin", () =>
  getClientsFallback(true),
);

export const getClients = async (includePrivate = false): Promise<Client[]> => {
  if (!hasDatabaseConfig()) {
    return getClientsFallback(includePrivate);
  }

  return includePrivate
    ? readAllClients(() => getClientsFromDatabase(true))
    : readPublicClients(() => getClientsFromDatabase(false));
};

export const getClientBySlug = async (slug: string): Promise<Client | null> => {
  const clients = await getClients();
  return clients.find((item) => item.slug === slug) ?? null;
};

export const refreshClientsCache = async (): Promise<void> => {
  if (!hasDatabaseConfig()) {
    return;
  }

  await readAllClients(() => getClientsFromDatabase(true));
};
