/**
 * External dependencies
 */
import { isEqual, pick, map } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withContext } from '@wordpress/components';
import { withViewportMatch } from '@wordpress/viewport';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { synchronizeBlocksWithTemplate } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockList from '../block-list';
import { withBlockEditContext } from '../block-edit/context';

class InnerBlocks extends Component {
	componentWillReceiveProps( nextProps ) {
		this.updateNestedSettings( {
			supportedBlocks: nextProps.allowedBlocks,
		} );
	}

	componentDidMount() {
		this.updateNestedSettings( {
			supportedBlocks: this.props.allowedBlocks,
		} );

		this.synchronizeBlocksWithTemplate();
	}

	componentDidUpdate( prevProps ) {
		const { template, block } = this.props;

		const hasTemplateChanged = ! isEqual( template, prevProps.template );
		const isTemplateInnerBlockMismatch = (
			template &&
			block.innerBlocks.length !== template.length
		);

		if ( hasTemplateChanged || isTemplateInnerBlockMismatch ) {
			this.synchronizeBlocksWithTemplate();
		}
	}

	/**
	 * Called on mount or when a mismatch exists between the templates and
	 * inner blocks, synchronizes inner blocks with the template, replacing
	 * current blocks.
	 */
	synchronizeBlocksWithTemplate() {
		const { template, block, replaceInnerBlocks } = this.props;
		const { innerBlocks } = block;

		// Synchronize with templates. If the next set differs, replace.
		const nextBlocks = synchronizeBlocksWithTemplate( innerBlocks, template );
		if ( ! isEqual( nextBlocks, innerBlocks	) ) {
			replaceInnerBlocks( nextBlocks );
		}
	}

	updateNestedSettings( newSettings ) {
		if ( ! isEqual( this.props.blockListSettings, newSettings ) ) {
			this.props.updateNestedSettings( newSettings );
		}
	}

	render() {
		const {
			uid,
			layouts,
			allowedBlocks,
			template,
			templateLock,
			isSmallScreen,
			isSelectedBlockInRoot,
		} = this.props;

		const classes = classnames( 'editor-inner-blocks', {
			'has-overlay': isSmallScreen && ! isSelectedBlockInRoot,
		} );

		return (
			<div className={ classes }>
				<BlockList
					rootUID={ uid }
					{ ...{ layouts, allowedBlocks, template, templateLock } }
				/>
			</div>
		);
	}
}

InnerBlocks = compose( [
	withBlockEditContext( ( context ) => pick( context, [ 'uid' ] ) ),
	withViewportMatch( { isSmallScreen: '< medium' } ),
	withSelect( ( select, ownProps ) => {
		const {
			isBlockSelected,
			hasSelectedInnerBlock,
			getBlock,
			getBlockListSettings,
		} = select( 'core/editor' );
		const { uid } = ownProps;

		return {
			isSelectedBlockInRoot: isBlockSelected( uid ) || hasSelectedInnerBlock( uid ),
			block: getBlock( uid ),
			blockListSettings: getBlockListSettings( uid ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			replaceBlocks,
			updateBlockListSettings,
		} = dispatch( 'core/editor' );
		const { block, uid } = ownProps;

		return {
			replaceInnerBlocks( blocks ) {
				const uids = map( block.innerBlocks, 'uid' );
				replaceBlocks( uids, blocks );
			},
			updateNestedSettings( settings ) {
				dispatch( updateBlockListSettings( uid, settings ) );
			},
		};
	} ),
] )( InnerBlocks );

InnerBlocks.Content = ( { BlockContent } ) => {
	return <BlockContent />;
};

InnerBlocks.Content = withContext( 'BlockContent' )()( InnerBlocks.Content );

export default InnerBlocks;
