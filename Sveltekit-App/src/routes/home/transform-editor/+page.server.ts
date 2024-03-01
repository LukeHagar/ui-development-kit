import { createConfiguration } from '$lib/sailpoint/sdk';
import {
	Paginator,
	TransformsApi,
	type Transform,
	TransformTypeEnum,
	type TransformsApiUpdateTransformRequest,
	type TransformsApiCreateTransformRequest,
	type TransformRead
} from 'sailpoint-api-client';
import type { Actions } from './$types';
import { Axios, AxiosError, isAxiosError, type AxiosResponse } from 'axios';
import { fail } from '@sveltejs/kit';

const createTransform: Transform = { name: 'Create New', type: TransformTypeEnum.AccountAttribute, attributes: null }

export const actions = {
	default: async ({ locals, request }) => {
		const data = await request.formData();

		console.log('default action');
		console.log('data', data);

		const config = createConfiguration(locals.session!.baseUrl, locals.idnSession!.access_token);
		const api = new TransformsApi(config);
		try {
			let resp: AxiosResponse<TransformRead, any>
			if ( JSON.parse(data.get('transform')?.toString() || '{}').id === undefined) {
				console.log('creating new transform')
				resp = await createNewTransform(data, api);
			} else {
				console.log('updating transform')
				resp = await updateTransform(data, api);
			}
	
	
			return { status: 'success' };
		} catch (error) {
			if (error && isAxiosError(error) && error.response) {
				return fail(error.response.status, {message: error.message})
			}
		}

	}
} satisfies Actions;

async function updateTransform(data: FormData, api: TransformsApi) {
	const transform = JSON.parse(data.get('transform')?.toString() || '{}');
	const updatedTransform = JSON.parse(data.get('updatedTransform')?.toString()!);


	const params: TransformsApiUpdateTransformRequest= {
		id: transform.id,
		transform: updatedTransform
	};

	const resp = await api.updateTransform(params);
	return resp;

}

async function createNewTransform(data: FormData, api: TransformsApi) {
	const updatedTransform = JSON.parse(data.get('updatedTransform')?.toString()!);


	const params: TransformsApiCreateTransformRequest= {
		transform: updatedTransform
	};

	const resp = await api.createTransform(params);
	return resp;

}

export const load = async ({ locals }) => {
	const config = createConfiguration(locals.session!.baseUrl, locals.idnSession!.access_token);
	const api = new TransformsApi(config);

	const transformResp = Paginator.paginate(api, api.listTransforms, { limit: 1000 });

	const transforms = new Promise<Transform[]>((resolve) => {
		transformResp.then((response) => {
			
			resolve([createTransform, ...response.data]);
		});
	});

	return { transforms };
};
