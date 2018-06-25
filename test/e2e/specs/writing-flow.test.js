/**
 * Internal dependencies
 */
import '../support/bootstrap';
import {
	newPost,
	newDesktopBrowserPage,
	getHTMLFromCodeEditor,
} from '../support/utils';

describe( 'adding blocks', () => {
	beforeAll( async () => {
		await newDesktopBrowserPage();
	} );

	beforeEach( async () => {
		await newPost();
	} );

	it( 'Should navigate inner blocks with arrow keys', async () => {
		let activeElementText;

		// Add demo content
		await page.click( '.editor-default-block-appender__content' );
		await page.keyboard.type( 'First paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/columns' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'First column paragraph' );

		// Arrow down should navigate through layouts in columns block (to
		// its default appender). Two key presses are required since the first
		// will land user on the Column wrapper block.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'Second column paragraph' );

		// Arrow down from last of layouts exits nested context to default
		// appender of root level.
		await page.keyboard.press( 'ArrowDown' );
		await page.keyboard.type( 'Second paragraph' );

		// Arrow up into nested context focuses last text input
		await page.keyboard.press( 'ArrowUp' );
		activeElementText = await page.evaluate( () => document.activeElement.textContent );
		expect( activeElementText ).toBe( 'Second column paragraph' );

		// Arrow up in inner blocks should navigate through (1) column wrapper,
		// (2) text fields.
		await page.keyboard.press( 'ArrowUp' );
		await page.keyboard.press( 'ArrowUp' );
		activeElementText = await page.evaluate( () => document.activeElement.textContent );
		expect( activeElementText ).toBe( 'First column paragraph' );

		// Arrow up from first text field in nested context focuses column and
		// columns wrappers before escaping out.
		let activeElementBlockType;
		await page.keyboard.press( 'ArrowUp' );
		activeElementBlockType = await page.evaluate( () => (
			document.activeElement.getAttribute( 'data-type' )
		) );
		expect( activeElementBlockType ).toBe( 'core/column' );
		await page.keyboard.press( 'ArrowUp' );
		activeElementBlockType = await page.evaluate( () => (
			document.activeElement.getAttribute( 'data-type' )
		) );
		expect( activeElementBlockType ).toBe( 'core/columns' );

		// Arrow up from focused (columns) block wrapper exits nested context
		// to prior text input.
		await page.keyboard.press( 'ArrowUp' );
		activeElementText = await page.evaluate( () => document.activeElement.textContent );
		expect( activeElementText ).toBe( 'First paragraph' );

		expect( await getHTMLFromCodeEditor() ).toMatchSnapshot();
	} );
} );
