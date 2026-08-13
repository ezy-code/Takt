import { Text } from '@mantine/core'
import github from 'highlight.js/styles/github.css?inline'
import githubDark from 'highlight.js/styles/github-dark.css?inline'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

// hljs themes bundled by Vite, then scoped to .markdown-preview under the
// active Mantine color scheme (CSS nesting) — both sheets ship in one <style>,
// no runtime <link> swap, no import.meta.glob into node_modules, no hand-maintained palette.
const scope = (css: string) => css.replace(/\.hljs/g, '.markdown-preview .hljs')
const sheet = `[data-mantine-color-scheme="light"]{${scope(github)}}[data-mantine-color-scheme="dark"]{${scope(githubDark)}}`
if (!document.querySelector('style[data-hljs]')) {
	const el = document.createElement('style')
	el.setAttribute('data-hljs', '')
	el.textContent = sheet
	document.head.appendChild(el)
}

export interface MarkdownPreviewProps {
	content: string
	maxLength?: number
	variant?: 'preview' | 'full'
}

export function MarkdownPreview({ content, maxLength, variant = 'preview' }: MarkdownPreviewProps) {
	const clean = content.replace(/<!-- luthor:meta .*? -->/g, '').trim()
	const preview =
		variant !== 'full' && maxLength != null && clean.length > maxLength ? clean.slice(0, maxLength) + '…' : clean
	if (!preview) return null
	const body = (
		<div className='markdown-preview'>
			<ReactMarkdown rehypePlugins={[rehypeHighlight]}>{preview}</ReactMarkdown>
		</div>
	)
	return variant === 'full' ? (
		body
	) : (
		<Text size='sm' component='div'>
			{body}
		</Text>
	)
}
