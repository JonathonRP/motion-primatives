<script lang="ts" module>
	
	function* animations() {
		 yield { scale: 0.8, backgroundColor: "#9EF4FF" };
		 yield { scale: 1.2, backgroundColor: "#0FBFFF" };
	}
</script>
<script lang="ts">
	import { interpolateHsl } from 'd3-interpolate';
	import { Spring, Tween } from 'svelte/motion';
	let animation = animations();
	let { name = "World", ref = $bindable() } = $props();
	// let { ref } = $props();

	// const reference = (node) => {
	// 	ref = node;
	// }

	let animated = $derived.by(() => {
		const { scale, backgroundColor } = $state(animation.next().value)
		let animate = {
			scale: new Spring(scale),
			backgroundColor: new Tween(backgroundColor, { interpolate: interpolateHsl })
		};

		return {
			get scale() {
				return animate.scale.current;
			},
			set scale(v) {
				animate.scale.target = v;
			},
			get backgroundColor() {
				return animate.backgroundColor.current;
			},
			set backgroundColor(v) {
				animate.backgroundColor.target = v;
			}
		};
	});

	$effect(() => {
		animated.scale;
		animated.backgroundColor;
		requestAnimationFrame(() => {
			ref.style.setProperty('scale', animated.scale as string);
			ref.style.setProperty('background-color', animated.backgroundColor as string)
		});
	});

	const animate = (node: HTMLElement | SVGElement | null, options) => {
		return {
			css: {
				scale: animated.scale,
				backgroundColor: animated.backgroundColor
			}
		}
	}

	// $inspect(backgroundColor);
	// $inspect(ref);
</script>

<div style="min-height: 350px; height: fit-content; touch-action:none; background: #000; display: flex; justify-content: center; align-items: center; margin-block: calc(0.25rem * 2); padding: calc(0.25rem * 6); width: 90%">
	<div class="box" bind:this={ref} onclick={() => {
		const next = animation.next();
		if (next.done) {
			animation = animations();
			({ scale: animated.scale, backgroundColor: animated.backgroundColor } = animation.next().value);
			return;
		}
		({ scale: animated.scale, backgroundColor: animated.backgroundColor } = next.value);
	}} transition:animate>
		<h1>Hello {name}!</h1>
	</div>
</div>
<style>
	.box {
		color: #455;
		width: 150px;
		height: 150px;
		background-color: #fff;
		border-radius: 30px;
		box-shadow: 0 0 10px #0000001a;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		font-size: 1.12rem;
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
	}
</style>