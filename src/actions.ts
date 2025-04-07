import {
	CompanionActionDefinition,
	CompanionActionDefinitions,
	CompanionActionEvent,
	InstanceBase,
	DropdownChoice,
} from '@companion-module/base'
import { EmberClient } from 'node-emberplus/lib/client/ember-client'
import { ParameterType, parameterTypeToString as typeToString } from 'node-emberplus/lib/common/parameter-type'
import { EmberPlusConfig } from './config'
import { TreeNode } from 'node-emberplus/lib/common/tree-node'
import { QualifiedParameter } from 'node-emberplus/lib/common/qualified-parameter'

export enum ActionId {
	SetValueExpression = 'setValueExpression',
	SetSnapShotLoad = 'setSnapShotLoad',
}

const setValue =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient, type: ParameterType) =>
	async (action: CompanionActionEvent): Promise<void> => {
		// getElementByPath is only working for Nodes -> seperate Param number from full path
		let path_nodes = []
		let param_num = ''
		if (action.options['varSource'] != undefined) {
			path_nodes = (action.options['varPath'] as string).split('.')
			path_nodes.pop()
			param_num = (action.options['varSource'] as string).split('.').pop() as string
			path_nodes.push(
				(action.options['varSource'] as string).split('.')[
					(action.options['varSource'] as string).split('.').length - 2
				],
			)
		} else {
			path_nodes = (action.options['varPath'] as string).split('.')
			param_num = path_nodes.pop() as string
		}
		const parent_node: TreeNode = await emberClient.getElementByPathAsync(path_nodes.join('.'))

		const param_node = parent_node.getElementByNumber(Number(param_num)) as QualifiedParameter

		let value = action.options['value']

		if (param_node && param_node.isParameter()) {
			if (type == ParameterType.integer && param_node.getJSONContent()['maximum']) {
				// check integer against Min/Max Ember+ value
				if (
					param_node.getJSONContent()['enumeration'] == undefined &&
					(value ?? 0) > param_node.getJSONContent()['maximum']
				)
					value = param_node.getJSONContent()['maximum']
				else if (
					param_node.getJSONContent()['enumeration'] == undefined &&
					(value ?? 0) < param_node.getJSONContent()['minimum']
				)
					value = param_node.getJSONContent()['minimum']
			}
			if (type == ParameterType.boolean) {
				await emberClient.setValueAsync(param_node, value == 'true' ? true : false, type)
			} else if (param_node.getJSONContent()['maximum'] || !isNaN(Number(value))) {
				await emberClient.setValueAsync(param_node, value as number, ParameterType.integer)
			} else if (type == ParameterType.string && param_node.getJSONContent()['type'] == typeToString(type)) {
				await emberClient.setValueAsync(param_node, value as string, type)
			} else {
				self.log(
					'warn',
					'Node ' +
						action.options['varPath'] +
						' is not of type ' +
						typeToString(type) +
						' (is ' +
						param_node.getJSONContent()['type'] +
						')',
				)
			}
		} else {
			self.log('warn', 'Parameter ' + action.options['varPath'] + ' not found or not a parameter')
		}
	}

const setValueExpression =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient) =>
	async (action: CompanionActionEvent): Promise<void> => {
		// getElementByPath is only working for Nodes -> seperate Param number from full path
		let path_nodes = []
		let param_num = ''
		if (action.options['varSource'] != undefined) {
			path_nodes = (action.options['varPath'] as string).split('.')
			path_nodes.pop()
			param_num = (action.options['varSource'] as string).split('.').pop() as string
			path_nodes.push(
				(action.options['varSource'] as string).split('.')[
					(action.options['varSource'] as string).split('.').length - 2
				],
			)
		} else {
			path_nodes = (action.options['varPath'] as string).split('.')
			param_num = path_nodes.pop() as string
		}

		const parent_node: TreeNode = await emberClient.getElementByPathAsync(path_nodes.join('.'))

		const param_node = parent_node.getElementByNumber(Number(param_num)) as QualifiedParameter

		if (param_node && param_node.isParameter()) {
			if (param_node.getJSONContent()['maximum']) {
				self.log('debug', 'Got node on ' + action.options['path'] + 'set val: ' + action.options['value'])
				let value = await self.parseVariablesInString(action.options['value'] as string)

				// check integer against Min/Max Ember+ value
				if (param_node.getJSONContent()['enumeration'] == undefined && value > param_node.getJSONContent()['maximum'])
					value = param_node.getJSONContent()['maximum']
				else if (
					param_node.getJSONContent()['enumeration'] == undefined &&
					value < param_node.getJSONContent()['minimum']
				)
					value = param_node.getJSONContent()['minimum']

				await emberClient.setValueAsync(param_node, Number(value), ParameterType.integer)
			} else {
				self.log(
					'warn',
					'Node ' +
						action.options['varPath'] +
						' is not of type ' +
						typeToString(ParameterType.integer) +
						' or ' +
						typeToString(ParameterType.enum) +
						' (is ' +
						param_node.getJSONContent()['type'] +
						')',
				)
			}
		} else {
			self.log('warn', 'Parameter ' + action.options['varPath'] + ' not found or not a parameter')
		}
	}

const setIncrementDecrement =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient, type: string) =>
	async (action: CompanionActionEvent): Promise<void> => {
		// getElementByPath is only working for Nodes -> seperate Param number from full path
		let path_nodes = []
		let param_num = ''
		if (action.options['varSource'] != undefined) {
			path_nodes = (action.options['varPath'] as string).split('.')
			path_nodes.pop()
			param_num = (action.options['varSource'] as string).split('.').pop() as string
			path_nodes.push(
				(action.options['varSource'] as string).split('.')[
					(action.options['varSource'] as string).split('.').length - 2
				],
			)
		} else {
			path_nodes = (action.options['varPath'] as string).split('.')
			param_num = path_nodes.pop() as string
		}

		const parent_node: TreeNode = await emberClient.getElementByPathAsync(path_nodes.join('.'))

		const param_node = parent_node.getElementByNumber(Number(param_num)) as QualifiedParameter

		if (param_node && param_node.isParameter()) {
			// check if integer or enum (parameter types have Content 'minimum' or 'maximum') -> value in Content 'type' is always string
			if (param_node.getJSONContent()['maximum']) {
				if (type === 'increment') {
					// check integer against Max Ember+ value
					if (
						param_node.getJSONContent()['enumeration'] == undefined &&
						Number(param_node.getJSONContent()['value']) + (action.options['value'] as number) >
							param_node.getJSONContent()['maximum']
					) {
						await emberClient.setValueAsync(
							param_node,
							Number(param_node.getJSONContent()['maximum']),
							ParameterType.integer,
						)
					} else {
						await emberClient.setValueAsync(
							param_node,
							Number(param_node.getJSONContent()['value']) + (action.options['value'] as number),
							ParameterType.integer,
						)
					}
				} else {
					// check integer against Min Ember+ value
					if (
						param_node.getJSONContent()['enumeration'] == undefined &&
						Number(param_node.getJSONContent()['value']) - (action.options['value'] as number) <
							param_node.getJSONContent()['minimum']
					) {
						await emberClient.setValueAsync(
							param_node,
							Number(param_node.getJSONContent()['minimum']),
							ParameterType.integer,
						)
					} else {
						await emberClient.setValueAsync(
							param_node,
							Number(param_node.getJSONContent()['value']) - (action.options['value'] as number),
							ParameterType.integer,
						)
					}
				}
			} else {
				self.log(
					'warn',
					'Node ' +
						action.options['varPath'] +
						' is not of type ' +
						typeToString(ParameterType.integer) +
						' or ' +
						typeToString(ParameterType.enum) +
						' (is ' +
						param_node.getJSONContent()['type'] +
						')',
				)
			}
		} else {
			self.log('warn', 'Parameter ' + action.options['varPath'] + ' not found or not a parameter')
		}
	}

const setToggle =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient) =>
	async (action: CompanionActionEvent): Promise<void> => {
		// getElementByPath is only working for Nodes -> seperate Param number from full path
		let path_nodes = []
		let param_num = ''
		if (action.options['varSource'] != undefined) {
			path_nodes = (action.options['varPath'] as string).split('.')
			path_nodes.pop()
			param_num = (action.options['varSource'] as string).split('.').pop() as string
			path_nodes.push(
				(action.options['varSource'] as string).split('.')[
					(action.options['varSource'] as string).split('.').length - 2
				],
			)
		} else {
			path_nodes = (action.options['varPath'] as string).split('.')
			param_num = path_nodes.pop() as string
		}

		const parent_node: TreeNode = await emberClient.getElementByPathAsync(path_nodes.join('.'))

		const param_node = parent_node.getElementByNumber(Number(param_num)) as QualifiedParameter

		if (param_node && param_node.isParameter()) {
			// check if boolean
			if (param_node.getJSONContent()['value'] === true || param_node.getJSONContent()['value'] === false) {
				if (param_node.getJSONContent()['value'] === true)
					await emberClient.setValueAsync(param_node, false, ParameterType.boolean)
				else await emberClient.setValueAsync(param_node, true, ParameterType.boolean)
			} else {
				self.log('warn', 'Node ' + action.options['varPath'] + ' is not of type Boolean')
			}
		} else {
			self.log('warn', 'Parameter ' + action.options['varPath'] + ' not found or not a parameter')
		}
	}

const triggerSnapLoad =
	(self: InstanceBase<EmberPlusConfig>, emberClient: EmberClient, config: EmberPlusConfig) =>
	async (action: CompanionActionEvent): Promise<void> => {
		// getElementByPath is only working for Nodes -> seperate Param number from full path
		// get Snapshot parameter
		let path_nodes = (
			config.monitoredParameters?.filter(({ label }) => label.endsWith('Slot')).find(() => true)?.id as string
		).split('.')
		let param_num = path_nodes.pop() as string

		let parent_node: TreeNode = await emberClient.getElementByPathAsync(path_nodes.join('.'))

		let param_node = parent_node.getElementByNumber(Number(param_num)) as QualifiedParameter

		if (param_node && param_node.isParameter()) {
			await emberClient.setValueAsync(param_node, action.options['value'] as number, ParameterType.integer)
		} else {
			self.log(
				'warn',
				'Parameter ' +
					config.monitoredParameters?.filter(({ label }) => label.includes('Snapshot')).find(() => true)?.id +
					' not found or not a parameter',
			)
		}

		// get Snapshot load parameter
		path_nodes = (
			config.monitoredParameters?.filter(({ label }) => label.endsWith('Load')).find(() => true)?.id as string
		).split('.')
		param_num = path_nodes.pop() as string

		parent_node = await emberClient.getElementByPathAsync(path_nodes.join('.'))

		param_node = parent_node.getElementByNumber(Number(param_num)) as QualifiedParameter

		if (param_node && param_node.isParameter()) {
			await emberClient.setValueAsync(param_node, 1, ParameterType.integer)
		} else {
			self.log(
				'warn',
				'Parameter ' +
					config.monitoredParameters?.filter(({ label }) => label.includes('Load')).find(() => true)?.id +
					' not found or not a parameter',
			)
		}
	}

function GetActionsListGeneral(
	self: InstanceBase<EmberPlusConfig>,
	emberClient: EmberClient,
	config: EmberPlusConfig,
): CompanionActionDefinitions {
	const actions: { [id in ActionId]: CompanionActionDefinition | undefined } = {
		[ActionId.SetValueExpression]: {
			name: 'Set Value with Expression',
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'varPath',
					choices: config.monitoredParameters?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label }) ?? [],
					default: config.monitoredParameters?.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'textinput',
					label: 'Value',
					id: 'value',
					useVariables: true,
				},
			],
			callback: setValueExpression(self, emberClient),
		},
		[ActionId.SetSnapShotLoad]: {
			name: 'Load Snapshot',
			options: [
				{
					type: 'number',
					label: 'Snapshot Slot',
					id: 'value',
					required: true,
					min: 1,
					max: 32,
					default: 1,
					step: 1,
				},
			],
			callback: triggerSnapLoad(self, emberClient, config),
		},
	}

	return actions
}

export function GetActionsList(
	self: InstanceBase<EmberPlusConfig>,
	emberClient: EmberClient,
	config: EmberPlusConfig,
): CompanionActionDefinitions {
	const companionActions: { [id: string]: CompanionActionDefinition | undefined } = {}
	// General actions
	for (const [key, value] of Object.entries(GetActionsListGeneral(self, emberClient, config)))
		companionActions[key] = value

	if (config.micIn) {
		for (const [key, value] of Object.entries(GetActionsforInterface(self, emberClient, config, 'Mic', 'Mic', 'Mic')))
			companionActions[key] = value
	}
	if (config.AES3In) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(self, emberClient, config, 'AES3In', 'Inputs.AESEBU', 'AESEBU Input'),
		))
			companionActions[key] = value
	}
	if (config.AES3Out) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(self, emberClient, config, 'AES3Out', 'Outputs.AESEBU', 'AESEBU Output'),
		))
			companionActions[key] = value
	}
	if (config.AnalogOut) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(self, emberClient, config, 'AnalogOut', 'Outputs.Analog', 'Analog Output'),
		))
			companionActions[key] = value
	}
	if (config.AoIPIn) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(self, emberClient, config, 'AoIPIn', 'Inputs.AoIP', 'AoIP Input'),
		))
			companionActions[key] = value
	}
	if (config.AoIPOut) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(self, emberClient, config, 'AoIPOut', 'Outputs.AoIP', 'AoIP Output'),
		))
			companionActions[key] = value
	}
	if (config.HPOut) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(self, emberClient, config, 'HP', 'Outputs.HP', 'Headphone'),
		))
			companionActions[key] = value
	}
	if (config.InputProc) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(
				self,
				emberClient,
				config,
				'InputProcOut',
				'Processing.InputProcessing',
				'Input Processing',
			),
		))
			companionActions[key] = value
	}
	if (config.OutputProc) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(
				self,
				emberClient,
				config,
				'OutputProc',
				'Processing.OutputProcessing',
				'Output Processing',
			),
		))
			companionActions[key] = value
	}
	if (config.MixMatrix) {
		for (const [key, value] of Object.entries(
			GetActionsforInterface(self, emberClient, config, 'MixMatrixOut', 'MixMatrix', 'MixMatrix Bus'),
		))
			companionActions[key] = value
		for (const [key, value] of Object.entries(
			GetActionsforInterface(self, emberClient, config, 'MixMatrixSource', 'MixMatrix.Bus', 'MixMatrix Bus'),
		))
			companionActions[key] = value
	}
	return companionActions
}

function GetActionsforInterface(
	self: InstanceBase<EmberPlusConfig>,
	emberClient: EmberClient,
	config: EmberPlusConfig,
	dev_interface: string,
	ember_parent: string,
	interface_name: string,
): CompanionActionDefinitions {
	const actions: { [id: string]: CompanionActionDefinition | undefined } = {
		['Set' + dev_interface + 'Label']: {
			name: 'Set ' + interface_name + ' Label',
			options: [
				{
					type: 'dropdown',
					label: 'Select ' + interface_name + ' channel',
					id: 'varPath',
					choices:
						config.monitoredParameters
							?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
							.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Label')) ?? [],
					default:
						config.monitoredParameters
							?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
							.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Label'))
							.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'textinput',
					label: 'Value',
					id: 'value',
				},
			],
			callback: setValue(self, emberClient, ParameterType.string),
		},
		['Set' + dev_interface + 'Gain']:
			!dev_interface.includes('Analag') &&
			!dev_interface.includes('AES3Out') &&
			!dev_interface.includes('AoIPOut') &&
			!dev_interface.includes('HP')
				? {
						name: dev_interface.includes('MixMatrixSource')
							? 'Set ' + interface_name + ' Source Gain'
							: 'Set ' + interface_name + ' Gain',
						options: dev_interface.includes('MixMatrixSource')
							? [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Source channel',
										id: 'varSource',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Gain'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Gain'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'number',
										label: 'Value',
										id: 'value',
										required: true,
										min: -0xffffffff,
										max: 0xffffffff,
										default: 0,
										step: 1,
									},
								]
							: [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'number',
										label: 'Value',
										id: 'value',
										required: true,
										min: -0xffffffff,
										max: 0xffffffff,
										default: 0,
										step: 1,
									},
								],
						callback: setValue(self, emberClient, ParameterType.integer),
					}
				: undefined,
		['Set' + dev_interface + 'GainIncrement']:
			!dev_interface.includes('Analag') &&
			!dev_interface.includes('AES3Out') &&
			!dev_interface.includes('AoIPOut') &&
			!dev_interface.includes('HP')
				? {
						name: dev_interface.includes('MixMatrixSource')
							? 'Set ' + interface_name + ' Source Gain Increment'
							: 'Set ' + interface_name + ' Gain Increment',
						options: dev_interface.includes('MixMatrixSource')
							? [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Source channel',
										id: 'varSource',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Gain'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Gain'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'number',
										label: 'Value',
										id: 'value',
										required: true,
										min: 0,
										max: 0xffffffff,
										default: 1,
										step: 1,
									},
								]
							: [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'number',
										label: 'Value',
										id: 'value',
										required: true,
										min: 0,
										max: 0xffffffff,
										default: 1,
										step: 1,
									},
								],
						callback: setIncrementDecrement(self, emberClient, 'increment'),
					}
				: undefined,
		['Set' + dev_interface + 'GainDecrement']:
			!dev_interface.includes('Analag') &&
			!dev_interface.includes('AES3Out') &&
			!dev_interface.includes('AoIPOut') &&
			!dev_interface.includes('HP')
				? {
						name: dev_interface.includes('MixMatrixSource')
							? 'Set ' + interface_name + ' Source Gain Decrement'
							: 'Set ' + interface_name + ' Gain Decrement',
						options: dev_interface.includes('MixMatrixSource')
							? [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Source channel',
										id: 'varSource',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Gain'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Gain'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'number',
										label: 'Value',
										id: 'value',
										required: true,
										min: 0,
										max: 0xffffffff,
										default: 1,
										step: 1,
									},
								]
							: [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'number',
										label: 'Value',
										id: 'value',
										required: true,
										min: 0,
										max: 0xffffffff,
										default: 1,
										step: 1,
									},
								],
						callback: setIncrementDecrement(self, emberClient, 'decrement'),
					}
				: undefined,
		['Set' + dev_interface + ' Volume']:
			dev_interface.includes('Analag') ||
			dev_interface.includes('AES3Out') ||
			dev_interface.includes('AoIPOut') ||
			dev_interface.includes('HP')
				? {
						name: 'Set ' + interface_name + ' Volume Value',
						options: [
							{
								type: 'dropdown',
								label: 'Select ' + interface_name + ' channel',
								id: 'varPath',
								choices:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Volume')) ?? [],
								default:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Volume'))
										.find(() => true)?.id ?? 'No paths configured!',
							},
							{
								type: 'number',
								label: 'Value',
								id: 'value',
								required: true,
								min: -0xffffffff,
								max: 0xffffffff,
								default: 0,
								step: 1,
							},
						],
						callback: setValue(self, emberClient, ParameterType.integer),
					}
				: undefined,
		['Set' + dev_interface + 'VolIncrement']:
			dev_interface.includes('Analag') ||
			dev_interface.includes('AES3Out') ||
			dev_interface.includes('AoIPOut') ||
			dev_interface.includes('HP')
				? {
						name: 'Set ' + interface_name + ' Volume Increment',
						options: [
							{
								type: 'dropdown',
								label: 'Select ' + interface_name + ' channel',
								id: 'varPath',
								choices:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Volume')) ?? [],
								default:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Volume'))
										.find(() => true)?.id ?? 'No paths configured!',
							},
							{
								type: 'number',
								label: 'Value',
								id: 'value',
								required: true,
								min: 0,
								max: 0xffffffff,
								default: 1,
								step: 1,
							},
						],
						callback: setIncrementDecrement(self, emberClient, 'increment'),
					}
				: undefined,
		['Set' + dev_interface + 'VolDecrement']:
			dev_interface.includes('Analag') ||
			dev_interface.includes('AES3Out') ||
			dev_interface.includes('AoIPOut') ||
			dev_interface.includes('HP')
				? {
						name: 'Set ' + interface_name + ' Volume Decrement',
						options: [
							{
								type: 'dropdown',
								label: 'Select ' + interface_name + ' channel',
								id: 'varPath',
								choices:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Volume')) ?? [],
								default:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Volume'))
										.find(() => true)?.id ?? 'No paths configured!',
							},
							{
								type: 'number',
								label: 'Value',
								id: 'value',
								required: true,
								min: 0,
								max: 0xffffffff,
								default: 1,
								step: 1,
							},
						],
						callback: setIncrementDecrement(self, emberClient, 'decrement'),
					}
				: undefined,
		['Toggle' + dev_interface + 'Generator']: dev_interface.includes('Mic')
			? {
					name: 'Toggle ' + interface_name + ' Generator',
					options: [
						{
							type: 'dropdown',
							label: 'Select Mic channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Generator')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Generator'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
					],
					callback: setToggle(self, emberClient),
				}
			: undefined,
		['Set' + dev_interface + 'Pan']: dev_interface.includes('MixMatrixSource')
			? {
					name: 'Set ' + interface_name + ' Source Pan',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select Source channel',
							id: 'varSource',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Pan'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Pan'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									)
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'number',
							label: 'Value',
							id: 'value',
							required: true,
							min: -0xffffffff,
							max: 0xffffffff,
							default: 0,
							step: 1,
						},
					],
					callback: setValue(self, emberClient, ParameterType.integer),
				}
			: undefined,
		['Set' + dev_interface + 'PanIncrement']: dev_interface.includes('MixMatrixSource')
			? {
					name: 'Set ' + interface_name + ' Source Pan Increment',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select Source channel',
							id: 'varSource',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Pan'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Pan'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									)
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'number',
							label: 'Value',
							id: 'value',
							required: true,
							min: 0,
							max: 0xffffffff,
							default: 1,
							step: 1,
						},
					],
					callback: setIncrementDecrement(self, emberClient, 'increment'),
				}
			: undefined,
		['Set' + dev_interface + 'PanDecrement']: dev_interface.includes('MixMatrixSource')
			? {
					name: 'Set ' + interface_name + ' Source Pan Decrement',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Gain'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select Source channel',
							id: 'varSource',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Pan'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Pan'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									)
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'number',
							label: 'Value',
							id: 'value',
							required: true,
							min: 0,
							max: 0xffffffff,
							default: 1,
							step: 1,
						},
					],
					callback: setIncrementDecrement(self, emberClient, 'decrement'),
				}
			: undefined,
		['Set' + dev_interface + 'Generator']: dev_interface.includes('Mic')
			? {
					name: 'Set ' + interface_name + ' Generator',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Generator')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Generator'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Generator state',
							id: 'value',
							choices: [
								{ id: 'true', label: 'on' },
								{ id: 'false', label: 'off' },
							],
							default: 'true',
						},
					],
					callback: setValue(self, emberClient, ParameterType.boolean),
				}
			: undefined,
		['Toggle' + dev_interface + 'Limiter']: dev_interface.includes('Mic')
			? {
					name: 'Toggle ' + interface_name + ' Limiter',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Limiter')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Limiter'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
					],
					callback: setToggle(self, emberClient),
				}
			: undefined,
		['Set' + dev_interface + 'Limiter']: dev_interface.includes('Mic')
			? {
					name: 'Set ' + interface_name + ' Limiter',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Limiter')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Limiter'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Limiter state',
							id: 'value',
							choices: [
								{ id: 'true', label: 'on' },
								{ id: 'false', label: 'off' },
							],
							default: 'true',
						},
					],
					callback: setValue(self, emberClient, ParameterType.boolean),
				}
			: undefined,
		['Toggle' + dev_interface + 'Link']: dev_interface.includes('Mic')
			? {
					name: 'Toggle ' + interface_name + ' Link',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Link')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Link'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
					],
					callback: setToggle(self, emberClient),
				}
			: undefined,
		['Set' + dev_interface + 'Link']: dev_interface.includes('Mic')
			? {
					name: 'Set ' + interface_name + ' Link',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Link')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Link'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Linking to next ' + interface_name + '?',
							id: 'value',
							choices: [
								{ id: 'true', label: 'link' },
								{ id: 'false', label: 'unlink' },
							],
							default: 'true',
						},
					],
					callback: setValue(self, emberClient, ParameterType.boolean),
				}
			: undefined,
		['Toggle' + dev_interface + 'Phantom']: dev_interface.includes('Mic')
			? {
					name: 'Toggle ' + interface_name + ' Split Phantom',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' Split channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Phantom')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Phantom'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
					],
					callback: setToggle(self, emberClient),
				}
			: undefined,
		['Set' + dev_interface + 'Phantom']: dev_interface.includes('Mic')
			? {
					name: 'Set ' + interface_name + ' Phantom Power',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' Split',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Phantom')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Phantom'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Phantom Power',
							id: 'value',
							choices: [
								{ id: 'true', label: 'on' },
								{ id: 'false', label: 'off' },
							],
							default: 'true',
						},
					],
					callback: setValue(self, emberClient, ParameterType.boolean),
				}
			: undefined,
		['Set' + dev_interface + 'HPF']: dev_interface.includes('Mic')
			? {
					name: 'Set ' + interface_name + ' HPF',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('HPF')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('HPF'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select HPF value',
							id: 'value',
							choices: config.MicHPF?.map((hpf, index) => <DropdownChoice>{ id: index, label: hpf }) ?? [],
							default:
								config.MicHPF?.map((hpf, index) => <DropdownChoice>{ id: index, label: hpf }).find(() => true)?.id ??
								'No values available!',
						},
					],
					callback: setValue(self, emberClient, ParameterType.enum),
				}
			: undefined,
		['Toggle' + dev_interface + 'Mute']: {
			name: dev_interface.includes('MixMatrixSource')
				? 'Toggle ' + interface_name + ' Source Mute'
				: 'Toggle ' + interface_name + ' Mute',
			options: dev_interface.includes('MixMatrixSource')
				? [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Mute'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Mute'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select Source channel',
							id: 'varSource',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Mute'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Mute'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									)
									.find(() => true)?.id ?? 'No paths configured!',
						},
					]
				: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Mute'),
									) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Mute'),
									)
									.find(() => true)?.id ?? 'No paths configured!',
						},
					],
			callback: setToggle(self, emberClient),
		},
		['Set' + dev_interface + 'Mute']: {
			name: dev_interface.includes('MixMatrixSource')
				? 'Set ' + interface_name + ' Source Mute'
				: 'Set ' + interface_name + ' Mute',
			options: dev_interface.includes('MixMatrixSource')
				? [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Mute'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Mute'),
									)
									.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select Source channel',
							id: 'varSource',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Mute'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Mute'))
									.map(
										({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
									)
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Set Mute state',
							id: 'value',
							choices: [
								{ id: 'true', label: 'mute' },
								{ id: 'false', label: 'unmute' },
							],
							default: 'true',
						},
					]
				: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Mute'),
									) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(
										({ label }) => label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Mute'),
									)
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select Mute state',
							id: 'value',
							choices: [
								{ id: 'true', label: 'mute' },
								{ id: 'false', label: 'unmute' },
							],
							default: 'true',
						},
					],
			callback: setValue(self, emberClient, ParameterType.boolean),
		},
		['Toggle' + dev_interface + 'Stereo']:
			!dev_interface.includes('Mic') && !dev_interface.includes('HP')
				? {
						name: dev_interface.includes('MixMatrixSource')
							? 'Toggle ' + interface_name + ' Source Stereo'
							: 'Toggle ' + interface_name + ' Stereo',
						options: dev_interface.includes('MixMatrixSource')
							? [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Stereo'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Stereo'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Source channel',
										id: 'varSource',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Stereo'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Stereo'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
								]
							: [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Stereo'),
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Stereo'),
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
								],
						callback: setToggle(self, emberClient),
					}
				: undefined,
		['Set' + dev_interface + 'Stereo']:
			!dev_interface.includes('Mic') && !dev_interface.includes('HP')
				? {
						name: dev_interface.includes('MixMatrixSource')
							? 'Set ' + interface_name + ' Source Stereo'
							: 'Set ' + interface_name + ' Stereo',
						options: dev_interface.includes('MixMatrixSource')
							? [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Stereo'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Stereo'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Source channel',
										id: 'varSource',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Stereo'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Stereo'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Stereo state',
										id: 'value',
										choices: [
											{ id: 'true', label: 'stereo' },
											{ id: 'false', label: 'mono' },
										],
										default: 'true',
									},
								]
							: [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Stereo'),
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Stereo'),
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Stereo state',
										id: 'value',
										choices: [
											{ id: 'true', label: 'stereo' },
											{ id: 'false', label: 'mono' },
										],
										default: 'true',
									},
								],
						callback: setValue(self, emberClient, ParameterType.boolean),
					}
				: undefined,
		['Toggle' + dev_interface + 'Mono']: dev_interface.includes('HP')
			? {
					name: 'Toggle ' + interface_name + ' Mono',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Mono')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Mono'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
					],
					callback: setToggle(self, emberClient),
				}
			: undefined,
		['Set' + dev_interface + 'Mono']: dev_interface.includes('HP')
			? {
					name: 'Set ' + interface_name + ' Mono',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Mono')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Mono'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select Mono state',
							id: 'value',
							choices: [
								{ id: 'true', label: 'mono' },
								{ id: 'false', label: 'stereo' },
							],
							default: 'true',
						},
					],
					callback: setValue(self, emberClient, ParameterType.boolean),
				}
			: undefined,
		['Toggle' + dev_interface + 'Phase']:
			dev_interface.includes('Mic') ||
			dev_interface.includes('InputProc') ||
			dev_interface.includes('OutputProc') ||
			dev_interface.includes('MixMatrix')
				? {
						name: dev_interface.includes('MixMatrixSource')
							? 'Toggle ' + interface_name + ' Source Phase'
							: 'Toggle ' + interface_name + ' Phase',
						options: dev_interface.includes('MixMatrixSource')
							? [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Phase'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Phase'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Source channel',
										id: 'varSource',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Phase'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Phase'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
								]
							: [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Phase'),
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Phase'),
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
								],
						callback: setToggle(self, emberClient),
					}
				: undefined,
		['Set' + dev_interface + 'Phase']:
			dev_interface.includes('Mic') ||
			dev_interface.includes('InputProc') ||
			dev_interface.includes('OutputProc') ||
			dev_interface.includes('MixMatrix')
				? {
						name: dev_interface.includes('MixMatrixSource')
							? 'Set ' + interface_name + ' Source Phase'
							: 'Set ' + interface_name + ' Phase',
						options: dev_interface.includes('MixMatrixSource')
							? [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Phase'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') }) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Phase'),
												)
												.map(({ id, label }) => <DropdownChoice>{ id: id, label: label.split('.', 3).join('.') })
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Source channel',
										id: 'varSource',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Phase'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) => label.includes('Bus1') && label.includes('Source') && label.endsWith('Phase'),
												)
												.map(
													({ id, label }) =>
														<DropdownChoice>{ id: id, label: label.split('.')[label.split('.').length - 2] },
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Phase state',
										id: 'value',
										choices: [
											{ id: 'true', label: 'reverse' },
											{ id: 'false', label: 'normal' },
										],
										default: 'true',
									},
								]
							: [
									{
										type: 'dropdown',
										label: 'Select ' + interface_name + ' channel',
										id: 'varPath',
										choices:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Phase'),
												) ?? [],
										default:
											config.monitoredParameters
												?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
												.filter(
													({ label }) =>
														label.includes(ember_parent) && !label.includes('Source') && label.endsWith('Phase'),
												)
												.find(() => true)?.id ?? 'No paths configured!',
									},
									{
										type: 'dropdown',
										label: 'Select Phase state',
										id: 'value',
										choices: [
											{ id: 'true', label: 'reverse' },
											{ id: 'false', label: 'normal' },
										],
										default: 'true',
									},
								],
						callback: setValue(self, emberClient, ParameterType.boolean),
					}
				: undefined,
		['Set' + dev_interface + 'Source']:
			dev_interface.includes('Analog') ||
			dev_interface.includes('AES3Out') ||
			dev_interface.includes('AoIPOut') ||
			dev_interface.includes('InputProc') ||
			dev_interface.includes('HP')
				? {
						name: 'Set ' + interface_name + 'Source Value',
						options: [
							{
								type: 'dropdown',
								label: 'Select ' + interface_name + ' channel',
								id: 'varPath',
								choices:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Source')) ?? [],
								default:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Source'))
										.find(() => true)?.id ?? 'No paths configured!',
							},
							{
								type: 'dropdown',
								label: 'Select source',
								id: 'value',
								choices: dev_interface.includes('HP')
									? (config.HPSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }) ?? [])
									: dev_interface.includes('InputProc')
										? (config.InputProcSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }) ?? [])
										: (config.OutputSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }) ?? []),
								default: dev_interface.includes('HP')
									? (config.HPSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }).find(() => true)
											?.id ?? 'No sources available!')
									: dev_interface.includes('InputProc')
										? (config.InputProcSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }).find(
												() => true,
											)?.id ?? 'No sources available!')
										: (config.OutputSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }).find(
												() => true,
											)?.id ?? 'No sources available!'),
							},
						],
						callback: setValue(self, emberClient, ParameterType.integer),
					}
				: undefined,
		['Toggle' + dev_interface + 'PFL']: dev_interface.includes('Out')
			? {
					name: 'Toggle ' + interface_name + ' PFL',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('PFL')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('PFL'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
					],
					callback: setToggle(self, emberClient),
				}
			: undefined,
		['Set' + dev_interface + 'PFL']: dev_interface.includes('Out')
			? {
					name: 'Set ' + interface_name + ' PFL',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('PFL')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('PFL'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select PFL state',
							id: 'value',
							choices: [
								{ id: 'true', label: 'on' },
								{ id: 'false', label: 'off' },
							],
							default: 'true',
						},
					],
					callback: setValue(self, emberClient, ParameterType.boolean),
				}
			: undefined,
		['Toggle' + dev_interface + 'Solo']: dev_interface.includes('Out')
			? {
					name: 'Toggle ' + interface_name + ' Solo',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Solo')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Solo'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
					],
					callback: setToggle(self, emberClient),
				}
			: undefined,
		['Set' + dev_interface + 'Solo']: dev_interface.includes('Out')
			? {
					name: 'Set ' + interface_name + ' Solo',
					options: [
						{
							type: 'dropdown',
							label: 'Select ' + interface_name + ' channel',
							id: 'varPath',
							choices:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Solo')) ?? [],
							default:
								config.monitoredParameters
									?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Solo'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select Solo state',
							id: 'value',
							choices: [
								{ id: 'true', label: 'on' },
								{ id: 'false', label: 'off' },
							],
							default: 'true',
						},
					],
					callback: setValue(self, emberClient, ParameterType.boolean),
				}
			: undefined,
		['Toggle' + dev_interface + 'MON']:
			dev_interface.includes('Mic') || dev_interface.endsWith('In')
				? {
						name: 'Toggle ' + interface_name + ' MON',
						options: [
							{
								type: 'dropdown',
								label: 'Select ' + interface_name + ' channel',
								id: 'varPath',
								choices:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('MON')) ?? [],
								default:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('MON'))
										.find(() => true)?.id ?? 'No paths configured!',
							},
						],
						callback: setToggle(self, emberClient),
					}
				: undefined,
		['Set' + dev_interface + 'MON']:
			dev_interface.includes('Mic') || dev_interface.endsWith('In')
				? {
						name: 'Set ' + interface_name + ' MON',
						options: [
							{
								type: 'dropdown',
								label: 'Select ' + interface_name + ' channel',
								id: 'varPath',
								choices:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('MON')) ?? [],
								default:
									config.monitoredParameters
										?.map(({ id, label }) => <DropdownChoice>{ id: id, label: label })
										.filter(({ label }) => label.includes(ember_parent) && label.endsWith('MON'))
										.find(() => true)?.id ?? 'No paths configured!',
							},
							{
								type: 'dropdown',
								label: interface_name + ' route to MON',
								id: 'value',
								choices: [
									{ id: 'true', label: 'on' },
									{ id: 'false', label: 'off' },
								],
								default: 'true',
							},
						],
						callback: setToggle(self, emberClient),
					}
				: undefined,
	}
	return actions
}
