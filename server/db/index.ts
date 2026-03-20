export const db = {
  insert(_table: any) {
    return {
      values(data: any) {
        return Promise.resolve(data);
      },
    };
  },

  select() {
    return {
      from(_table: any) {
        return Promise.resolve([]);
      },
    };
  },

  execute(_query: any) {
    return Promise.resolve({ rows: [] as any[] });
  },
};
