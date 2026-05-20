/**
 * MarkdownRenderer 组件
 * 
 * 渲染 Markdown 内容，支持：
 * - GFM 扩展（表格、删除线等）
 * - 自定义样式
 * - 代码高亮
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 表格样式
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-neutral-200">
              <table className="min-w-full text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-neutral-100">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-medium text-neutral-700 border-b border-neutral-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-b border-neutral-100">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-neutral-50">{children}</tr>
          ),
          // 行内代码
          code: ({ className: codeClassName, children, ...props }) => {
            // 检查是否是代码块（有语言类名）
            const isInline = !codeClassName;
            return isInline ? (
              <code className="bg-neutral-100 text-accent-purple px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            ) : (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          // 代码块容器
          pre: ({ children }) => (
            <pre className="bg-neutral-100 text-neutral-800 p-4 rounded-lg overflow-x-auto text-sm font-mono my-3 border border-neutral-200">
              {children}
            </pre>
          ),
          // 标题
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-neutral-900 mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-neutral-900 mt-4 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-neutral-900 mt-4 mb-2">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-neutral-800 mt-3 mb-1">{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-medium text-neutral-800 mt-2 mb-1">{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-neutral-700 mt-2 mb-1">{children}</h6>
          ),
          // 列表
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2 text-neutral-800">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2 text-neutral-800">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-neutral-800">{children}</li>
          ),
          // 段落
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed text-neutral-800">{children}</p>
          ),
          // 分割线
          hr: () => (
            <hr className="my-4 border-neutral-200" />
          ),
          // 强调
          strong: ({ children }) => (
            <strong className="font-semibold text-neutral-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-neutral-700">{children}</em>
          ),
          // 链接
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-accent-purple hover:underline" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // 引用
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neutral-300 pl-4 my-3 text-neutral-600 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}