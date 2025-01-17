import { type JSX, lazy, createMemo } from 'solid-js';

import { multiagent } from '~/api/globals/agent.ts';
import { getRecordId } from '~/api/utils/misc';

import type { SignalizedPost } from '~/api/stores/posts';

import { openModal } from '../../../globals/modals';

import { MenuItem, MenuItemIcon, MenuRoot } from '../../../primitives/menu';

import { Flyout } from '../../Flyout';
import { isProfileTempMuted, useSharedPreferences } from '../../SharedPreferences';

import DeleteIcon from '../../../icons/baseline-delete';
import LaunchIcon from '../../../icons/baseline-launch';
import ReportIcon from '../../../icons/baseline-report';
import TranslateIcon from '../../../icons/baseline-translate';
import VisibilityIcon from '../../../icons/baseline-visibility';
import VisibilityOffIcon from '../../../icons/baseline-visibility-off';
import VolumeOffIcon from '../../../icons/baseline-volume-off';
import VolumeUpIcon from '../../../icons/baseline-volume-up';

const DeletePostConfirmDialog = lazy(() => import('../../dialogs/DeletePostConfirmDialog'));
const MuteConfirmDialog = lazy(() => import('../../dialogs/MuteConfirmDialog'));
const ReportDialog = lazy(() => import('../../dialogs/ReportDialog'));
const SilenceConfirmDialog = lazy(() => import('../../dialogs/SilenceConfirmDialog'));

export interface PostOverflowActionProps {
	post: SignalizedPost;
	onTranslate?: () => void;
	children: JSX.Element;
}

const PostOverflowAction = (props: PostOverflowActionProps) => {
	const { filters } = useSharedPreferences();

	const onTranslate = props.onTranslate;

	return (() => {
		const post = props.post;
		const author = post.author;

		const authorDid = author.did;

		const isSameAuthor = post.uid === authorDid;
		const isOwnAccount = createMemo(() => multiagent.accounts.some((account) => account.did === authorDid));

		const isTempMuted = () => isProfileTempMuted(filters, author.did);
		const isMuted = () => author.viewer.muted.value;

		if (import.meta.env.VITE_MODE === 'desktop') {
			return (
				<Flyout button={props.children} placement="bottom-end">
					{({ close, menuProps }) => (
						<div {...menuProps} class={/* @once */ MenuRoot()}>
							<a
								href={`https://bsky.app/profile/${author.did}/post/${getRecordId(post.uri)}`}
								target="_blank"
								onClick={close}
								class={/* @once */ MenuItem()}
							>
								<LaunchIcon class={/* @once */ MenuItemIcon()} />
								<span>Open in Bluesky app</span>
							</a>

							{onTranslate && (
								<button
									onClick={() => {
										close();
										onTranslate();
									}}
									class={/* @once */ MenuItem()}
								>
									<TranslateIcon class={/* @once */ MenuItemIcon()} />
									<span>Translate post</span>
								</button>
							)}

							{isSameAuthor && (
								<button
									onClick={() => {
										close();
										openModal(() => <DeletePostConfirmDialog post={post} />);
									}}
									class={/* @once */ MenuItem()}
								>
									<DeleteIcon class={/* @once */ MenuItemIcon()} />
									<span>Delete post</span>
								</button>
							)}

							{!isSameAuthor && (
								<button
									onClick={() => {
										close();
										openModal(() => (
											<MuteConfirmDialog uid={/* @once */ author.uid} did={/* @once */ author.did} />
										));
									}}
									class={/* @once */ MenuItem()}
								>
									{(() => {
										const Icon = !isMuted() ? VolumeOffIcon : VolumeUpIcon;
										return <Icon class={/* @once */ MenuItemIcon()} />;
									})()}
									<span>
										{!isMuted() ? `Mute @${author.handle.value}` : `Unmute @${author.handle.value}`}
									</span>
								</button>
							)}

							{(() => {
								if (!isOwnAccount()) {
									return (
										<button
											onClick={() => {
												close();
												openModal(() => <SilenceConfirmDialog profile={author} />);
											}}
											class={/* @once */ MenuItem()}
										>
											{(() => {
												const Icon = !isMuted() ? VisibilityOffIcon : VisibilityIcon;
												return <Icon class={/* @once */ MenuItemIcon()} />;
											})()}
											<span>
												{!isTempMuted()
													? `Silence @${author.handle.value}`
													: `Unsilence @${author.handle.value}`}
											</span>
										</button>
									);
								}
							})()}

							<button
								onClick={() => {
									close();

									openModal(() => (
										<ReportDialog
											uid={/* @once */ post.uid}
											report={/* @once */ { type: 'post', uri: post.uri, cid: post.cid.value }}
										/>
									));
								}}
								class={/* @once */ MenuItem()}
							>
								<ReportIcon class={/* @once */ MenuItemIcon()} />
								<span class="overflow-hidden text-ellipsis whitespace-nowrap">Report post</span>
							</button>
						</div>
					)}
				</Flyout>
			);
		}

		return props.children;
	}) as unknown as JSX.Element;
};

export default PostOverflowAction;
