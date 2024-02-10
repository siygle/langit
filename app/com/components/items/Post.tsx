import { type Accessor, createEffect, createMemo } from 'solid-js';

import type { DID } from '~/api/atp-schema';

import type { SignalizedPost } from '~/api/stores/posts';
import type { SignalizedTimelineItem } from '~/api/models/timeline';
import { getRecordId } from '~/api/utils/misc';

import { updatePostLike } from '~/api/mutations/like-post';

import { getProfileModDecision } from '../../moderation/profile';

import { formatCompact } from '~/utils/intl/number';
import { isElementClicked } from '~/utils/interaction';
import { clsx } from '~/utils/misc';

import {
	type PostLinking,
	type ProfileLinking,
	LINK_PROFILE,
	LINK_POST,
	Link,
	useLinking,
} from '../Link';
import RichTextRenderer from '../RichTextRenderer';
import { useSharedPreferences } from '../SharedPreferences';
import TimeAgo from '../TimeAgo';

import ChatBubbleOutlinedIcon from '../../icons/outline-chat-bubble';
import ErrorIcon from '../../icons/baseline-error';
import FavoriteIcon from '../../icons/baseline-favorite';
import FavoriteOutlinedIcon from '../../icons/outline-favorite';
import MoreHorizIcon from '../../icons/baseline-more-horiz';
import RepeatIcon from '../../icons/baseline-repeat';
import ShareIcon from '../../icons/baseline-share';

import DefaultAvatar from '../../assets/default-user-avatar.svg?url';

import PostWarning from '../moderation/PostWarning';
import Embed from '../embeds/Embed';

import PostOverflowAction from './posts/PostOverflowAction';
import PostShareAction from './posts/PostShareAction';
import ReplyAction from './posts/ReplyAction';
import RepostAction from './posts/RepostAction';

export interface PostProps {
	/** Expected to be static */
	post: SignalizedPost;
	parent?: SignalizedPost;
	reason?: SignalizedTimelineItem['reason'];
	prev?: boolean;
	next?: boolean;
	interactive?: boolean;
	highlight?: boolean;
	timelineDid?: DID;
}

const Post = (props: PostProps) => {
	const linking = useLinking();

	const post = props.post;

	const author = post.author;
	const record = post.record;
	const viewer = post.viewer;

	const authorPermalink: ProfileLinking = { type: LINK_PROFILE, actor: author.did };
	const postPermalink: PostLinking = { type: LINK_POST, actor: author.did, rkey: getRecordId(post.uri) };

	const profileVerdict = createMemo(() => {
		return getProfileModDecision(author, useSharedPreferences());
	});

	const handleClick = (ev: MouseEvent | KeyboardEvent) => {
		if (!props.interactive || !isElementClicked(ev)) {
			return;
		}

		linking.navigate(postPermalink);
	};

	return (
		<div
			tabindex={props.interactive ? 0 : undefined}
			onClick={handleClick}
			onKeyDown={handleClick}
			class={clsx([
				`relative border-divider px-4 outline-2 -outline-offset-2 outline-primary focus-visible:outline`,
				!props.next && `border-b`,
				props.interactive && `hover:bg-secondary/10`,
			])}
		>
			{(() => {
				if (props.highlight) {
					return <div class="absolute bottom-0 left-0 top-0 w-1 bg-accent/60"></div>;
				}
			})()}

			<div class="flex flex-col gap-1 pt-3">
				{(() => {
					const reason = props.reason;

					if (reason) {
						return (
							<div class="-mt-1 mb-1 flex items-center gap-3 text-de text-muted-fg">
								<div class="flex w-10 shrink-0 justify-end">
									<RepeatIcon />
								</div>
								<Link
									to={{ type: LINK_PROFILE, actor: reason.by.did }}
									class="flex min-w-0 font-medium hover:underline"
								>
									<span dir="auto" class="overflow-hidden text-ellipsis whitespace-nowrap">
										{/* @once */ reason.by.displayName || reason.by.handle}
									</span>
									<span class="shrink-0 whitespace-pre"> Reposted</span>
								</Link>
							</div>
						);
					}
				})()}

				{(() => {
					const prev = props.prev;
					const parent = props.parent;

					if (!prev) {
						if (parent) {
							return (
								<div class="-mt-1 mb-1 flex items-center gap-3 text-de text-muted-fg">
									<div class="flex w-10 shrink-0 justify-end">
										<ChatBubbleOutlinedIcon />
									</div>
									<Link
										to={
											/* @once */ {
												type: LINK_POST,
												actor: parent.author.did,
												rkey: getRecordId(parent.uri),
											}
										}
										class="flex min-w-0 font-medium hover:underline"
									>
										<span class="shrink-0 whitespace-pre">Replying to </span>
										<span dir="auto" class="overflow-hidden text-ellipsis whitespace-nowrap">
											{(() => {
												const author = parent.author;
												return author.displayName.value || '@' + author.handle.value;
											})()}
										</span>
									</Link>
								</div>
							);
						}

						if (record.value.reply) {
							return (
								<div class="-mt-1 mb-1 flex items-center gap-3 text-de text-muted-fg">
									<div class="flex w-10 shrink-0 justify-end">
										<ChatBubbleOutlinedIcon />
									</div>
									<Link to={postPermalink} class="flex min-w-0 font-medium hover:underline">
										Show full thread
									</Link>
								</div>
							);
						}
					}
				})()}
			</div>

			<div class="flex gap-3">
				<div class="relative flex shrink-0 flex-col items-center">
					<Link
						tabindex={-1}
						to={authorPermalink}
						class="h-10 w-10 overflow-hidden rounded-full hover:opacity-80"
					>
						<img
							src={author.avatar.value || DefaultAvatar}
							class={clsx([`h-full w-full`, !!author.avatar.value && profileVerdict()?.m && `blur`])}
						/>
					</Link>
					{(() => {
						const verdict = profileVerdict();

						if (verdict) {
							return (
								<div
									class={
										/* @once */
										`absolute left-7 top-7 rounded-full bg-background ` +
										(verdict.a ? `text-red-500` : `text-muted-fg`)
									}
								>
									<ErrorIcon class="text-lg" />
								</div>
							);
						}
					})()}

					{(() => {
						if (props.next) {
							return <div class="mt-3 grow border-l-2 border-divider" />;
						}
					})()}
				</div>

				<div class="min-w-0 grow pb-3">
					<div class="mb-0.5 flex items-center justify-between gap-4">
						<div class="flex items-center overflow-hidden text-sm text-muted-fg">
							<Link
								to={authorPermalink}
								class="group flex max-w-full gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-left"
							>
								{author.displayName.value && (
									<bdi class="overflow-hidden text-ellipsis group-hover:underline">
										<span class="font-bold text-primary">{author.displayName.value}</span>
									</bdi>
								)}

								<span class="block overflow-hidden text-ellipsis whitespace-nowrap">
									@{author.handle.value}
								</span>
							</Link>

							<span class="px-1">·</span>

							<TimeAgo value={record.value.createdAt}>
								{(relative, absolute) => (
									<Link to={postPermalink} title={absolute()} class="whitespace-nowrap hover:underline">
										{relative()}
									</Link>
								)}
							</TimeAgo>
						</div>

						{(() => {
							if (props.interactive) {
								return (
									<div class="shrink-0">
										<PostOverflowAction post={post}>
											<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base text-muted-fg hover:bg-secondary/40">
												<MoreHorizIcon />
											</button>
										</PostOverflowAction>
									</div>
								);
							}
						})()}
					</div>

					<PostContent post={post} postPermalink={postPermalink} timelineDid={() => props.timelineDid} />

					{(() => {
						if (props.interactive) {
							return (
								<div class="mt-3 flex text-muted-fg">
									<div class="min-w-0 grow basis-0">
										<ReplyAction post={post}>
											{(disabled) => (
												<button class="group flex max-w-full items-end gap-0.5">
													<div
														class={
															/* @once */ clsx([
																`-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40 group-disabled:opacity-50`,
																disabled && `opacity-50`,
															])
														}
													>
														<ChatBubbleOutlinedIcon />
													</div>
													<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
														{formatCompact(post.replyCount.value)}
													</span>
												</button>
											)}
										</ReplyAction>
									</div>

									<div class="min-w-0 grow basis-0">
										<RepostAction post={post}>
											<button
												class={clsx([
													`group flex max-w-full grow basis-0 items-end gap-0.5`,
													viewer.repost.value && `text-green-600`,
												])}
											>
												<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40">
													<RepeatIcon />
												</div>

												<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
													{formatCompact(post.repostCount.value)}
												</span>
											</button>
										</RepostAction>
									</div>

									<div class="min-w-0 grow basis-0">
										<button
											onClick={() => updatePostLike(post, !viewer.like.value)}
											class={clsx([
												`group flex max-w-full grow basis-0 items-end gap-0.5`,
												viewer.like.value && `is-active text-red-600`,
											])}
										>
											<div class="-my-1.5 -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base group-hover:bg-secondary/40">
												<FavoriteOutlinedIcon class="group-[.is-active]:hidden" />
												<FavoriteIcon class="hidden group-[.is-active]:block" />
											</div>
											<span class="overflow-hidden text-ellipsis whitespace-nowrap pr-2 text-de">
												{formatCompact(post.likeCount.value)}
											</span>
										</button>
									</div>

									<div class="shrink-0">
										<PostShareAction post={post}>
											<button class="-mx-2 -my-1.5 flex h-8 w-8 items-center justify-center rounded-full text-base hover:bg-secondary/40">
												<ShareIcon />
											</button>
										</PostShareAction>
									</div>
								</div>
							);
						}
					})()}
				</div>
			</div>
		</div>
	);
};

export default Post;

// <PostContent />
interface PostContentProps {
	post: SignalizedPost;
	postPermalink: PostLinking;
	timelineDid: Accessor<DID | undefined>;
}

const PostContent = ({ post, postPermalink, timelineDid }: PostContentProps) => {
	const embed = post.embed;

	let content: HTMLDivElement | undefined;

	return (
		<PostWarning post={post} timelineDid={timelineDid()}>
			{(decision) => (
				<>
					<div ref={content} class="line-clamp-[12] whitespace-pre-wrap break-words text-sm">
						<RichTextRenderer
							item={post}
							get={(item) => {
								const record = item.record.value;
								return { t: record.text, f: record.facets };
							}}
						/>
					</div>

					<Link
						ref={(node) => {
							node.style.display = post.$truncated !== false ? 'block' : 'none';

							createEffect(() => {
								const delta = content!.scrollHeight - content!.clientHeight;
								const next = delta > 10 && !!post.record.value.text;

								post.$truncated = next;
								node.style.display = next ? 'block' : 'none';
							});
						}}
						to={postPermalink}
						class="text-sm text-accent hover:underline"
					>
						Show more
					</Link>

					{embed.value && <Embed post={post} decision={decision} />}
				</>
			)}
		</PostWarning>
	);
};
