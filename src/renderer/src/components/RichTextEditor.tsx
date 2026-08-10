import type { ExtensiveEditorProps, ExtensiveEditorRef } from '@lyfie/luthor'
import { Skeleton, useMantineColorScheme } from '@mantine/core'
import { forwardRef, lazy, Suspense } from 'react'

const ExtensiveEditor = lazy(() => import('@lyfie/luthor').then((m) => ({ default: m.ExtensiveEditor })))

const editorThemeOverrides = {
	'--luthor-bg': 'var(--mantine-color-body)',
	'--luthor-fg': 'var(--mantine-color-text)',
	'--luthor-border': 'var(--mantine-color-default-border)',
	'--luthor-border-hover': 'var(--mantine-color-default-hover)',
	'--luthor-border-active': 'var(--mantine-primary-color-filled)',
	'--luthor-accent': 'var(--mantine-primary-color-filled)',
	'--luthor-accent-hover': 'var(--mantine-primary-color-filled-hover)',
	'--luthor-muted': 'var(--mantine-color-default)',
	'--luthor-muted-fg': 'var(--mantine-color-dimmed)',
	'--luthor-toolbar-bg': 'var(--mantine-color-body)',
	'--luthor-toolbar-section-border': 'var(--mantine-color-default-border)',
	'--luthor-toolbar-button-fg': 'var(--mantine-color-text)',
	'--luthor-toolbar-button-hover-bg': 'var(--mantine-color-default-hover)',
	'--luthor-toolbar-button-hover-border': 'var(--mantine-color-default-border)',
	'--luthor-toolbar-button-active-bg': 'var(--mantine-primary-color-filled)',
	'--luthor-toolbar-button-active-border': 'var(--mantine-primary-color-filled)',
	'--luthor-toolbar-button-active-fg': 'var(--mantine-primary-color-contrast)',
	'--luthor-toolbar-highlight-bg': 'var(--mantine-primary-color-light)',
	'--luthor-placeholder-color': 'var(--mantine-color-placeholder)',
	'--luthor-link-color': 'var(--mantine-color-anchor)',
	'--luthor-quote-bg': 'var(--mantine-color-default)',
	'--luthor-quote-fg': 'var(--mantine-color-text)',
	'--luthor-quote-border': 'var(--mantine-color-default-border)',
	'--luthor-list-marker-color': 'var(--mantine-color-dimmed)',
	'--luthor-list-checkbox-color': 'var(--mantine-primary-color-filled)',
	'--luthor-table-border-color': 'var(--mantine-color-default-border)',
	'--luthor-table-header-bg': 'var(--mantine-color-default)',
	'--luthor-hr-color': 'var(--mantine-color-default-border)',
	'--luthor-codeblock-bg': 'var(--mantine-color-default)',
	'--luthor-preset-bg': 'var(--mantine-color-body)',
	'--luthor-preset-fg': 'var(--mantine-color-text)',
	'--luthor-preset-border': 'var(--mantine-color-default-border)',
	'--luthor-preset-muted': 'var(--mantine-color-default)',
	'--luthor-preset-muted-fg': 'var(--mantine-color-dimmed)',
	'--luthor-preset-accent': 'var(--mantine-primary-color-filled)',
	'--luthor-floating-bg': 'var(--mantine-color-body)',
	'--luthor-floating-fg': 'var(--mantine-color-text)',
	'--luthor-floating-border': 'var(--mantine-color-default-border)',
	'--luthor-floating-border-hover': 'var(--mantine-color-default-hover)',
	'--luthor-floating-border-active': 'var(--mantine-primary-color-filled)',
	'--luthor-floating-accent': 'var(--mantine-primary-color-filled)',
	'--luthor-floating-accent-fg': 'var(--mantine-primary-color-contrast)',
	'--luthor-floating-muted': 'var(--mantine-color-dimmed)',
}

const toolbarVisibility = {
	fontFamily: false,
	fontSize: false,
	lineHeight: false,
	textColor: false,
	textHighlight: false,
	subscript: false,
	superscript: false,
	alignJustify: false,
	checkList: false,
	indentList: false,
	outdentList: false,
	horizontalRule: false,
	table: false,
	image: false,
	emoji: false,
	embed: false,
	customComponent: false,
	commandPalette: false,
	themeToggle: false,
}

export type RichTextEditorProps = Omit<
	ExtensiveEditorProps,
	| 'className'
	| 'editorThemeOverrides'
	| 'initialTheme'
	| 'initialMode'
	| 'availableModes'
	| 'isEditorViewTabsVisible'
	| 'toolbarVisibility'
>

export const RichTextEditor = forwardRef<ExtensiveEditorRef, RichTextEditorProps>(function RichTextEditor(props, ref) {
	const { colorScheme } = useMantineColorScheme()
	const initialTheme =
		colorScheme === 'auto'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: colorScheme

	return (
		<Suspense fallback={<Skeleton height={200} />}>
			<ExtensiveEditor
				{...props}
				ref={ref}
				className='luthor-editor'
				editorThemeOverrides={editorThemeOverrides}
				initialTheme={initialTheme}
				initialMode='visual-editor'
				availableModes={['visual-editor', 'markdown']}
				isEditorViewTabsVisible={false}
				toolbarVisibility={toolbarVisibility}
			/>
		</Suspense>
	)
})
