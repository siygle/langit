import { type JSX, lazy } from 'solid-js';

import { getRecordId } from '~/api/utils/misc';

import type { SignalizedList } from '~/api/stores/lists';

import { openModal } from '~/com/globals/modals';

import { MenuItem, MenuItemIcon, MenuRoot } from '~/com/primitives/menu';

import { Flyout } from '~/com/components/Flyout';

import DeleteIcon from '~/com/icons/baseline-delete';
import LaunchIcon from '~/com/icons/baseline-launch';
import ReportIcon from '~/com/icons/baseline-report';

const ReportDialog = lazy(() => import('~/com/components/dialogs/ReportDialog'));
const PruneListOrphanDialog = lazy(() => import('~/com/components/dialogs/lists/PruneListOrphanDialog'));

export interface FeedOverflowActionProps {
	list: SignalizedList;
	children: JSX.Element;
}

const ListOverflowAction = (props: FeedOverflowActionProps) => {
	return (() => {
		const list = props.list;
		const creator = list.creator;

		const isOwner = list.uid === creator.did;

		return (
			<Flyout button={props.children} placement="bottom-end">
				{({ close, menuProps }) => (
					<div {...menuProps} class={/* @once */ MenuRoot()}>
						<a
							href={`https://bsky.app/profile/${creator.did}/lists/${getRecordId(list.uri)}`}
							target="_blank"
							onClick={close}
							class={/* @once */ MenuItem()}
						>
							<LaunchIcon class={/* @once */ MenuItemIcon()} />
							<span>Open in Bluesky app</span>
						</a>

						{isOwner && (
							<button
								onClick={() => {
									close();
									openModal(() => <PruneListOrphanDialog list={list} />);
								}}
								class={/* @once */ MenuItem()}
							>
								<DeleteIcon class={/* @once */ MenuItemIcon()} />
								<span>Prune orphan members</span>
							</button>
						)}

						<button
							onClick={() => {
								close();

								openModal(() => (
									<ReportDialog
										uid={/* @once */ list.uid}
										report={/* @once */ { type: 'list', uri: list.uri, cid: list.cid.value }}
									/>
								));
							}}
							class={/* @once */ MenuItem()}
						>
							<ReportIcon class={/* @once */ MenuItemIcon()} />
							<span class="overflow-hidden text-ellipsis whitespace-nowrap">Report list</span>
						</button>
					</div>
				)}
			</Flyout>
		);
	}) as unknown as JSX.Element;
};

export default ListOverflowAction;
