import { Text, useMantineColorScheme } from '@mantine/core'
import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

// ponytail: theme css loaded via one shared <link>; singleton avoids duplicating links per card
const hljsThemes = import.meta.glob('../../../../node_modules/highlight.js/styles/github{,-dark}.css', {
	query: '?url',
})
let themeLink: HTMLLinkElement | null = null
function applyHljsTheme(colorScheme: string) {
	if (!themeLink) {
		themeLink = document.createElement('link')
		themeLink.rel = 'stylesheet'
		document.head.appendChild(themeLink)
	}
	const loader =
		colorScheme === 'light'
			? hljsThemes['../../../../node_modules/highlight.js/styles/github.css']
			: hljsThemes['../../../../node_modules/highlight.js/styles/github-dark.css']
	loader().then((m) => {
		if (themeLink) themeLink.href = m.default
	})
}

export interface MarkdownPreviewProps {
	content: string
	maxLength?: number
	variant?: 'preview' | 'full'
}

export function MarkdownPreview({ content, maxLength, variant = 'preview' }: MarkdownPreviewProps) {
	const { colorScheme } = useMantineColorScheme()
	useEffect(() => {
		applyHljsTheme(colorScheme)
	}, [colorScheme])
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
