<script lang="ts">
	import type { ExportFormDefinitionsByTenant200ResponseInnerBeta } from 'sailpoint-api-client';
	import Progress from '$lib/Components/Progress.svelte';
	export let data;

	console.log(data);

	let selectedForm: ExportFormDefinitionsByTenant200ResponseInnerBeta;
	let dialog: HTMLDialogElement;
	let inputs = {};
	let loading = false;
	let formUrl: string;
	let conditions = new Map();

	function parseFormConditions(conditions) {
		let parsedConditionals = new Map();
		console.log(conditions);
		for (const condition of conditions || []) {
			for (const rule of condition.rules) {
				console.log(rule);
				const temp = parsedConditionals.get(rule.source) || [];
				parsedConditionals.set(rule.source, Array.from(new Set([...temp, rule.value])));
			}
		}

		console.log(parsedConditionals);
		return parsedConditionals;
	}

	$: if (selectedForm) {
		conditions = parseFormConditions(selectedForm.object?.formConditions);
	}
</script>

<dialog class="card p-8 dark:text-white" bind:this={dialog}>
	<div class="flex flex-col gap-4">
		{#if selectedForm}
			<p id="name" class="text-center">
				Name: {selectedForm.object?.name}
			</p>
			<p>
				Description: <br />
				{selectedForm.object?.description}
			</p>
			<div>
				<p>Form Inputs:</p>
				{#if selectedForm.object?.formInput}
					{#each selectedForm.object?.formInput as input}
						{#if conditions.get(input.label)}
							<label class="label" for={input.label}>
								<span>{input.label}</span>
								<select class="input" id={input.label} bind:value={inputs[input.label]}>
									{#each conditions.get(input.label) as condition}
										<option value={condition}>{condition}</option>
									{/each}
								</select>
							</label>
						{:else}
							<label class="label" for={input.label}>
								<span>{input.label}</span>
								<input
									class="input"
									id={input.label}
									bind:value={inputs[input.label]}
									type="text"
								/>
							</label>
						{/if}
					{/each}
				{/if}
			</div>
		{/if}
		{#if loading}
			<div class="flex flex-row justify-center">
				<Progress width="w-[80px]" />
			</div>
		{:else}
			{#if formUrl}
				<a class="btn variant-filled-secondary" href={formUrl} target="_blank" rel="noreferrer">
					Open Form
				</a>
			{/if}
			<button
				class="btn variant-filled-primary"
				on:click={async () => {
					loading = true;
					console.log(inputs);
					const formResp = await fetch('/api/sailpoint/form/create-instance', {
						method: 'POST',
						body: JSON.stringify({ formDefinitionId: selectedForm.object?.id, formInput: inputs })
					});
					const respData = await formResp.json();
					console.log(respData);

					formUrl = respData.formInstanceResp.standAloneFormUrl;
					loading = false;
				}}
			>
				{#if formUrl}
					Refresh form link
				{:else}
					Create form link
				{/if}
			</button>
		{/if}
		<button
			class="btn variant-filled-warning"
			on:click={() => {
				dialog.close();
			}}
		>
			Close
		</button>
	</div>
</dialog>

<div>
	{#await data.forms}
		<div class="flex flex-row justify-center">
			<Progress width="w-[80px]" />
		</div>
	{:then forms}
		<div class="flex flex-row">
			{#each forms as form}
				<div class="card flex flex-col p-4 gap-4">
					{#if form.object}
						<p id="name" class="text-center">
							Name: {form.object?.name}
						</p>
					{/if}
					<p>
						ID: {form.object?.id}
					</p>
					<p>
						Description: <br />
						{form.object?.description}
					</p>
					<div>
						<p>Form Inputs:</p>
						{#if form.object?.formInput}
							{#each form.object?.formInput as input}
								<p class="">
									{input.label}
								</p>
							{/each}
						{/if}
					</div>

					<button
						class="btn variant-filled-primary"
						on:click={() => {
							selectedForm = form;
							dialog.showModal();
						}}
					>
						Assign form
					</button>
				</div>
			{/each}
		</div>
	{/await}
</div>
