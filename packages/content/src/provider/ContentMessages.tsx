'use client';

import * as React from 'react';

export interface ContentMessages {
  code: {
    copy: string;
    copied: string;
    copyFailed: string;
    label: string;
  };
  image: {
    unavailable: string;
  };
  unsupported: {
    title: string;
    detail: (kind: string) => string;
  };
  state: {
    loading: string;
    empty: string;
    retry: string;
  };
}

export interface ContentMessagesOverrides {
  code?: Partial<ContentMessages['code']>;
  image?: Partial<ContentMessages['image']>;
  unsupported?: Partial<ContentMessages['unsupported']>;
  state?: Partial<ContentMessages['state']>;
}

export interface ContentMessagesProviderProps {
  messages?: ContentMessagesOverrides;
  children?: React.ReactNode;
}

export const contentZhCN: ContentMessages = {
  code: {
    copy: '复制代码',
    copied: '已复制代码',
    copyFailed: '复制失败',
    label: '代码',
  },
  image: {
    unavailable: '图片无法显示',
  },
  unsupported: {
    title: '暂不支持此内容',
    detail: (kind) => `内容类型：${kind}`,
  },
  state: {
    loading: '正在加载内容…',
    empty: '暂无内容。',
    retry: '重试',
  },
};

export const contentEnUS: ContentMessages = {
  code: {
    copy: 'Copy code',
    copied: 'Code copied',
    copyFailed: 'Copy failed',
    label: 'Code',
  },
  image: {
    unavailable: 'Image unavailable',
  },
  unsupported: {
    title: 'Content not supported',
    detail: (kind) => `Content type: ${kind}`,
  },
  state: {
    loading: 'Loading content…',
    empty: 'No content.',
    retry: 'Retry',
  },
};

export function mergeContentMessages(base: ContentMessages, overrides?: ContentMessagesOverrides): ContentMessages {
  if (!overrides) return base;
  return {
    code: { ...base.code, ...overrides.code },
    image: { ...base.image, ...overrides.image },
    unsupported: { ...base.unsupported, ...overrides.unsupported },
    state: { ...base.state, ...overrides.state },
  };
}

const ContentMessagesContext = React.createContext<ContentMessages>(contentZhCN);

export function ContentMessagesProvider({ messages, children }: ContentMessagesProviderProps) {
  const outer = React.useContext(ContentMessagesContext);
  const value = React.useMemo(() => mergeContentMessages(outer, messages), [outer, messages]);
  return <ContentMessagesContext.Provider value={value}>{children}</ContentMessagesContext.Provider>;
}

export function useContentMessages(): ContentMessages {
  return React.useContext(ContentMessagesContext);
}
