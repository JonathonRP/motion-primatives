import { AnimationFrames, StateHistory } from 'runed';
// import { Tween } from 'svelte/motion'

export class MainThreadAnimation {
	// #state;
	private driver = new AnimationFrames(this.#frame.bind(this), { immediate: false, fpsLimit: 60 });
	initial = $state();
	delay = $state();
	start = $state();
	hold: number | null = $state(null);
	currentTime = $state();
	started = false;
	// value = $state()
	// history = new StateHistory(() => value, (v) => (value = v))
	target = $state();
	current = $state();
	progress = $state();
	duration = $state();
	state = $derived.by(() => {
		let animation = $state({ current: this.driver?.running ? 'running' : 'paused' });
		return animation
	});
	// this is to keep delta untouched like in original
	// though I would use this.current here and let delta update
	delta = $derived(this.target - this.initial);
	
	constructor(initial, { target, auto_play = false, delay = 0, duration = 300, easing = (t) => t } = {}) {
		this.initial = initial
		this.target = target
		this.current = initial
		this.duration = duration
		this.delay = delay;
		this.progress = 0;
		this.easing = easing;
		this.state.current = 'idle';

		// this.#state = Tween.of(() => this.value, { duration, easing })

		if (auto_play) this.play();
	}

	// svelte Tween uses this from raf.now()
	// timestamp/time from RAF is fanicy according to svelte in source
	now() {
		return performance?.now() ?? Date.now();
	}

	play() {
		if (this.driver.running) return;
		if (this.hold !== null) {
			this.start = this.now() - this.hold;
		} else if (!this.start) {
			this.start = this.now();
		} else if (this.state.current === "finished") {
			this.start = this.now();
		}

		if (this.state.current === "finished") {
			this.updateFinishedPromise()
		}

		this.cancel = this.start;
		this.hold = null;
		
		this.#driver.start()
	}

	pause() {
		if (!this.#driver.running) return;

        this.state.current = 'paused';
		this.hold = this.currentTime ?? 0;
		// this.#driver.stop();
	}

    /**
	 * This method is bound to the instance to fix a pattern where
	 * animation.stop is returned as a reference from a useEffect.
	 */
	stop = () => {
		this.resolver.cancel();
		this.isStopped = true;
		if (this.state === 'idle') return;
		this.teardown();
		const { onStop } = this.options;
		onStop && onStop();
	};

	complete() {
		if (this.state !== 'running') {
			this.play();
		}

		this.pendingPlayState = this.state = 'finished';
		this.holdTime = null;
	}

	finish() {
		this.teardown();
		this.state = 'finished';

		const { onComplete } = this.options;
		onComplete && onComplete();
	}

	cancel() {
		if (this.cancelTime !== null) {
			this.tick(this.cancelTime);
		}
		this.teardown();
		this.updateFinishedPromise();
	}

	private teardown() {
		this.state = 'idle';
		this.stopDriver();
		this.resolveFinishedPromise();
		this.updateFinishedPromise();
		this.startTime = this.cancelTime = null;
		this.resolver.cancel();
	}

	private stopDriver() {
		if (!this.driver) return;
		this.driver.stop();
		this.driver = undefined;
	}

	// reverse() {
	// 	const initial = this.initial
		
	// 	this.initial = this.target
	// 	this.target = initial
	// 	this.play()
	// }
	
	// reset() {
	// 	// this.history.undo();
	// 	this.current = this.initial
	// 	this.progress = 0
	// }
	
	// replay() {
	// 	this.reset()
	// 	this.play()
	// }

	#frame({ timestamp, delta }) {
		if (!this.#driver.running) return
		if (this.now() < this.start) {
			return;
		}

		if (!this.started) {
			this.started = true;
			return;
		}

		const elapsed = this.now() - this.start;

		if (elapsed > this.duration) {
			this.current = this.target;
			this.progress = 1;
			this.#driver.stop();
			return;
		}

		// console.log(elapsed)
		const difference = this.target - this.current
		this.progress = Math.min(1, (((elapsed / this.duration) * difference) / 100).toFixed(2));
		// only draw back is resuming the easing effect resets instead of continuing.
		// would be great to have a mechinism here to enable different types,
		// currently on tween. but spring or others would be great as this is only animation playback controls.
		this.current = this.current + (this.easing(this.progress)) * elapsed;
		// console.log('current: ' + this.current, 'progress: ' + this.progress)
	}
}