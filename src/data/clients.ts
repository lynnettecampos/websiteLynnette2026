import type { Client } from "@/content/clients";
import { CLIENTS } from "@/content/clients";
import { mergeFallbackRecordsUntilInitialized } from "@/data/content-bootstrap";
import { hasDatabaseConfig } from "@/lib/env";
import {
  fetchClientBySlug,
  fetchClientsFromDatabase,
  isClientsCollectionInitialized,
} from "@/server/clients";

let warnedClientFallback = false;

const logClientFallback = (reason: string) => {
  if (!warnedClientFallback) {
    console.warn(`[clients] Usando contenido local: ${reason}`);
    warnedClientFallback = true;
  }
};

const filterPrivate = (clients: Client[], includePrivate: boolean) =>
  includePrivate ? clients : clients.filter((client) => !client.isPrivate);

const sortClients = (clients: Client[]) =>
  [...clients].sort((first, second) => {
    const orderDifference =
      (first.order ?? Number.MAX_SAFE_INTEGER) - (second.order ?? Number.MAX_SAFE_INTEGER);
    return orderDifference || first.name.localeCompare(second.name);
  });

export const getClients = async (includePrivate = false): Promise<Client[]> => {
  if (!hasDatabaseConfig()) {
    return filterPrivate(CLIENTS, includePrivate);
  }

  const [clients, initialized] = await Promise.all([
    fetchClientsFromDatabase(),
    isClientsCollectionInitialized(),
  ]);

  if (!clients || initialized === null) {
    logClientFallback("no se pudo contactar la base de datos");
    return filterPrivate(CLIENTS, includePrivate);
  }

  const resolvedClients = mergeFallbackRecordsUntilInitialized(CLIENTS, clients, initialized);
  return filterPrivate(sortClients(resolvedClients), includePrivate);
};

export const getClientBySlug = async (slug: string): Promise<Client | null> => {
  if (!hasDatabaseConfig()) {
    return CLIENTS.find((client) => client.slug === slug) ?? null;
  }

  const client = await fetchClientBySlug(slug);

  if (client) {
    return client;
  }

  const clients = await getClients();
  return clients.find((item) => item.slug === slug) ?? null;
};

export const refreshClientsCache = async (): Promise<void> => {
  if (!hasDatabaseConfig()) {
    return;
  }

  const clients = await fetchClientsFromDatabase();
  if (!clients) {
    logClientFallback("no se pudo contactar la base de datos");
  }
};
