export type GeneratedFile = {
  path: string;
  content: string;
};

export type McpConfiguration = {
  mcpServers: {
    shadcn: {
      command: string;
      args: readonly string[];
    };
  };
};
