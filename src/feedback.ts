import {
	CompanionFeedbackDefinition,
	CompanionFeedbackDefinitions,
	combineRgb,
	InstanceBase,
	DropdownChoice,
} from '@companion-module/base'
import { EmberClient } from 'node-emberplus/lib/client/ember-client'
import { EmberPlusConfig } from './config'

enum FeedbackIdGeneral {
	Parameter = 'parameter',
	hitThreshold = 'hitThreshold',
	belowThreshold = 'belowThreshold',
	toggleEqual = 'toggleEqual,',
}

export const curr_feedbacks: { [id: string]: CompanionFeedbackDefinition | undefined } = {}

export function GetFeedbacksList(
	_self: InstanceBase<EmberPlusConfig>,
	_emberClient: EmberClient,
	config: EmberPlusConfig,
): CompanionFeedbackDefinitions {
	// General feedbacks
	for (const [key, value] of Object.entries(GetFeedbacksGeneral(_self, _emberClient, config)))
		curr_feedbacks[key] = value

	if (config.HPOut) {
		for (const [key, value] of Object.entries(GetFeedbacksforInterface(_self, _emberClient, config, 'HP', 'Headphone')))
			curr_feedbacks[key] = value
	}
	if (config.InputProc) {
		for (const [key, value] of Object.entries(
			GetFeedbacksforInterface(_self, _emberClient, config, 'InputProcessing', 'Input Processing'),
		))
			curr_feedbacks[key] = value
	}
	if (config.OutputProc) {
		for (const [key, value] of Object.entries(
			GetFeedbacksforInterface(_self, _emberClient, config, 'OutputProcessing', 'Output Processing'),
		))
			curr_feedbacks[key] = value
	}
	if (config.micIn) {
		for (const [key, value] of Object.entries(GetFeedbacksforInterface(_self, _emberClient, config, 'Mic', 'Mic')))
			curr_feedbacks[key] = value
	}

	return curr_feedbacks
}

function GetFeedbacksGeneral(
	_self: InstanceBase<EmberPlusConfig>,
	_emberClient: EmberClient,
	config: EmberPlusConfig,
): CompanionFeedbackDefinitions {
	const feedbacks: { [id in FeedbackIdGeneral]: CompanionFeedbackDefinition | undefined } = {
		[FeedbackIdGeneral.Parameter]: {
			name: 'Parameter Equals',
			description: 'Checks the current value of a paramter',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'path',
					choices:
						config.monitoredParameters
							?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
							.filter(({ label }) => label.endsWith('Volume') || label.endsWith('Gain') || label.endsWith('Pan')) ?? [],
					default:
						config.monitoredParameters
							?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
							.filter(({ label }) => label.endsWith('Volume') || label.endsWith('Gain') || label.endsWith('Pan'))
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
				},
			],
			callback: (feedback) => {
				return (
					(_self.getVariableValue(feedback.options['path']?.toString() ?? '') as number) == feedback.options['value']
				)
			},
		},
		[FeedbackIdGeneral.toggleEqual]: {
			name: 'Toggle Parameter Equals',
			description: 'Checks the current value of a paramter',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select Parameter',
					id: 'path',
					choices:
						config.monitoredParameters
							?.map(({ label }) => <DropdownChoice>{ id: label, label: label })
							.filter(
								({ label }) =>
									label.endsWith('Mute') ||
									label.endsWith('Phase') ||
									label.endsWith('Phantom') ||
									label.endsWith('Link') ||
									label.endsWith('Limiter') ||
									label.endsWith('MON') ||
									label.endsWith('PFL') ||
									label.endsWith('Solo') ||
									label.endsWith('Stereo') ||
									label.endsWith('Mono') ||
									label.endsWith('Generator'),
							) ?? [],
					default:
						config.monitoredParameters
							?.map(({ label }) => <DropdownChoice>{ id: label, label: label })
							.filter(
								({ label }) =>
									label.endsWith('Mute') ||
									label.endsWith('Phase') ||
									label.endsWith('Phantom') ||
									label.endsWith('Link') ||
									label.endsWith('Limiter') ||
									label.endsWith('MON') ||
									label.endsWith('PFL') ||
									label.endsWith('Solo') ||
									label.endsWith('Stereo') ||
									label.endsWith('Mono') ||
									label.endsWith('Generator'),
							)
							.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'checkbox',
					label: 'Value',
					id: 'value',
					default: true,
				},
			],
			callback: (feedback) => {
				return (
					(_self.getVariableValue(feedback.options['path']?.toString() ?? '') as boolean) == feedback.options['value']
				)
			},
		},
		[FeedbackIdGeneral.hitThreshold]: {
			name: 'Parameter hit Threshold',
			description: 'Checks the current value of a paramter against the threshold',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'path',
					choices:
						config.monitoredParameters
							?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
							.filter(({ label }) => label.endsWith('Volume') || label.endsWith('Gain') || label.endsWith('Pan')) ?? [],
					default:
						config.monitoredParameters
							?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
							.filter(({ label }) => label.endsWith('Volume') || label.endsWith('Gain') || label.endsWith('Pan'))
							.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Threshold',
					id: 'threshold',
					required: true,
					min: -0xffffffff,
					max: 0xffffffff,
					default: 0,
				},
			],
			callback: (feedback) => {
				return (
					(_self.getVariableValue(feedback.options['path']?.toString() ?? '') as number) >
					(feedback.options['threshold'] as number)
				)
			},
		},
		[FeedbackIdGeneral.belowThreshold]: {
			name: 'Parameter below Threshold',
			description: 'Checks the current value of a paramter to be below the threshold',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 255, 255),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Select registered path',
					id: 'path',
					choices:
						config.monitoredParameters
							?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
							.filter(({ label }) => label.endsWith('Volume') || label.endsWith('Gain') || label.endsWith('Pan')) ?? [],
					default:
						config.monitoredParameters
							?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
							.filter(({ label }) => label.endsWith('Volume') || label.endsWith('Gain') || label.endsWith('Pan'))
							.find(() => true)?.id ?? 'No paths configured!',
				},
				{
					type: 'number',
					label: 'Threshold',
					id: 'threshold',
					required: true,
					min: -0xffffffff,
					max: 0xffffffff,
					default: 0,
				},
			],
			callback: (feedback) => {
				return (
					(_self.getVariableValue(feedback.options['path']?.toString() ?? '') as number) <
					(feedback.options['threshold'] as number)
				)
			},
		},
	}
	return feedbacks
}

function GetFeedbacksforInterface(
	_self: InstanceBase<EmberPlusConfig>,
	_emberClient: EmberClient,
	config: EmberPlusConfig,
	ember_parent: string,
	interface_name: string,
): CompanionFeedbackDefinitions {
	const feedbacks: { [id: string]: CompanionFeedbackDefinition | undefined } = {
		['Feedback' + ember_parent + 'SourceEqual']: !ember_parent.includes('Mic')
			? {
					name: interface_name + ' Source Parameter Equals',
					description: 'Checks the current value of a paramter',
					type: 'boolean',
					defaultStyle: {
						bgcolor: combineRgb(255, 255, 255),
						color: combineRgb(0, 0, 0),
					},
					options: [
						{
							type: 'dropdown',
							label: 'Select registered path',
							id: 'path',
							choices:
								config.monitoredParameters
									?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Source')) ?? [],
							default:
								config.monitoredParameters
									?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('Source'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select source',
							id: 'value',
							choices: ember_parent.includes('HP')
								? (config.HPSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }) ?? [])
								: ember_parent.includes('InputProcessing')
									? (config.InputProcSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }) ?? [])
									: (config.OutputSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }) ?? []),
							default: ember_parent.includes('HP')
								? (config.HPSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }).find(() => true)
										?.id ?? 'No sources available!')
								: ember_parent.includes('InputProcessing')
									? (config.InputProcSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }).find(
											() => true,
										)?.id ?? 'No sources available!')
									: (config.OutputSources?.map((src, index) => <DropdownChoice>{ id: index, label: src }).find(
											() => true,
										)?.id ?? 'No sources available!'),
						},
					],
					callback: (feedback) => {
						return (
							_self.getVariableValue(feedback.options['path']?.toString() ?? '') ==
							(ember_parent.includes('HP') &&
							config.HPSources!.length > 0 &&
							(feedback.options['value'] as number) < config.HPSources!.length
								? config.HPSources![feedback.options['value'] as number]
								: ember_parent.includes('InputProcessing') &&
									  config.InputProcSources!.length > 0 &&
									  (feedback.options['value'] as number) < config.InputProcSources!.length
									? config.InputProcSources![feedback.options['value'] as number]
									: config.OutputSources!.length > 0 &&
										  (feedback.options['value'] as number) < config.OutputSources!.length
										? config.OutputSources![feedback.options['value'] as number]
										: undefined)
						)
					},
				}
			: undefined,
		['Feedback' + ember_parent + 'HPFEqual']: ember_parent.includes('Mic')
			? {
					name: interface_name + ' HPF Parameter Equals',
					description: 'Checks the current value of a paramter',
					type: 'boolean',
					defaultStyle: {
						bgcolor: combineRgb(255, 255, 255),
						color: combineRgb(0, 0, 0),
					},
					options: [
						{
							type: 'dropdown',
							label: 'Select registered path',
							id: 'path',
							choices:
								config.monitoredParameters
									?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('HPF')) ?? [],
							default:
								config.monitoredParameters
									?.map((item) => <DropdownChoice>{ id: item.label, label: item.label })
									.filter(({ label }) => label.includes(ember_parent) && label.endsWith('HPF'))
									.find(() => true)?.id ?? 'No paths configured!',
						},
						{
							type: 'dropdown',
							label: 'Select HPF value',
							id: 'value',
							choices: config.MicHPF?.map((src, index) => <DropdownChoice>{ id: index, label: src }) ?? [],
							default:
								config.MicHPF?.map((src, index) => <DropdownChoice>{ id: index, label: src }).find(() => true)?.id ??
								'No sources available!',
						},
					],
					callback: (feedback) => {
						return (
							_self.getVariableValue(feedback.options['path']?.toString() ?? '') ==
							(config.MicHPF!.length > 0 && (feedback.options['value'] as number) < config.MicHPF!.length
								? config.MicHPF![feedback.options['value'] as number]
								: undefined)
						)
					},
				}
			: undefined,
	}

	return feedbacks
}
