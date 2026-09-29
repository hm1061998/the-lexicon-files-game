export type CommerceConfig = {
  schemaVersion: 1;
  mode: 'free' | 'commercial';
};

export interface CommerceConfigProvider {
  load(): Promise<CommerceConfig>;
}

export const FREE_COMMERCE_CONFIG: CommerceConfig = Object.freeze({
  schemaVersion: 1,
  mode: 'free',
});

export function createDefaultCommerceConfigProvider(): CommerceConfigProvider {
  return {
    async load() {
      return FREE_COMMERCE_CONFIG;
    },
  };
}

export const defaultCommerceConfigProvider = createDefaultCommerceConfigProvider();

function validateCommerceConfig(value: unknown): CommerceConfig | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const config = value as Record<string, unknown>;
  const keys = Object.keys(config);
  if (
    keys.length !== 2 ||
    !Object.hasOwn(config, 'schemaVersion') ||
    !Object.hasOwn(config, 'mode') ||
    config.schemaVersion !== 1 ||
    (config.mode !== 'free' && config.mode !== 'commercial')
  )
    return null;
  return { schemaVersion: 1, mode: config.mode };
}

export async function loadCommerceConfig(
  provider: CommerceConfigProvider = defaultCommerceConfigProvider,
): Promise<CommerceConfig> {
  try {
    return validateCommerceConfig(await provider.load()) ?? FREE_COMMERCE_CONFIG;
  } catch {
    return FREE_COMMERCE_CONFIG;
  }
}
