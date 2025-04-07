import { Regex, SomeCompanionConfigField } from '@companion-module/base'

export const portDefault = 9000

export type monitoredParameters = { id: string; label: string }
export type parsingPath = { path: string; elements: string[] }

export interface EmberPlusConfig {
	host?: string
	port?: number
	take?: boolean
	micIn?: boolean
	HPOut?: boolean
	AnalogOut?: boolean
	AES3In?: boolean
	AES3Out?: boolean
	AoIPIn?: boolean
	AoIPOut?: boolean
	InputProc?: boolean
	OutputProc?: boolean
	MixMatrix?: boolean
	parseNodeFilter?: parsingPath[]
	monitoredParameters?: monitoredParameters[]
	OutputSources?: string[]
	InputProcSources?: string[]
	HPSources?: string[]
	MicHPF?: string[]
	MixBusStart?: number
	MixBusEnd?: number
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			tooltip: 'The IP of the ember+ provider',
			width: 6,
			regex: Regex.IP,
		},
		{
			type: 'number',
			id: 'port',
			label: 'Target Port',
			tooltip: 'Usually 9000 by default',
			width: 6,
			min: 1,
			max: 0xffff,
			step: 1,
			default: portDefault,
		},
		{
			type: 'checkbox',
			id: 'micIn',
			label: 'Mic In controls',
			tooltip: 'enable/disable controls for Mic In',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'HPOut',
			label: 'Headphone Out controls',
			tooltip: 'enable/disable controls for Headphone Out',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'AnalogOut',
			label: 'Analog Out controls',
			tooltip: 'enable/disable controls for Analog Out',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'AES3In',
			label: 'AESEBU In controls',
			tooltip: 'enable/disable controls for AESEBU In',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'AES3Out',
			label: 'AESEBU Out controls',
			tooltip: 'enable/disable controls for AESEBU Out',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'AoIPIn',
			label: 'AoIP In controls',
			tooltip: 'enable/disable controls for AoIP In',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'AoIPOut',
			label: 'AoIP Out controls',
			tooltip: 'enable/disable controls for AoIP Out',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'InputProc',
			label: 'Input Processing controls',
			tooltip: 'enable/disable controls for Input Processing',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'OutputProc',
			label: 'Output Processing controls',
			tooltip: 'enable/disable controls for Output Processing',
			width: 6,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'MixMatrix',
			label: 'MixMatrix controls',
			tooltip: 'enable/disable controls for MixMatrix (CAUTION: limited to max. 4 Busses)',
			width: 6,
			default: false,
		},
		{
			type: 'dropdown',
			id: 'MixBusStart',
			label: 'MixMatrix Bus Range Start index',
			choices: [
				{ id: 1, label: 'Bus1' },
				{ id: 2, label: 'Bus2' },
				{ id: 3, label: 'Bus3' },
				{ id: 4, label: 'Bus4' },
				{ id: 5, label: 'Bus5' },
				{ id: 6, label: 'Bus6' },
				{ id: 7, label: 'Bus7' },
				{ id: 8, label: 'Bus8' },
				{ id: 9, label: 'Bus9' },
				{ id: 10, label: 'Bus10' },
				{ id: 11, label: 'Bus11' },
				{ id: 12, label: 'Bus12' },
				{ id: 13, label: 'Bus13' },
				{ id: 14, label: 'Bus14' },
				{ id: 15, label: 'Bus15' },
				{ id: 16, label: 'Bus16' },
				{ id: 17, label: 'Bus17' },
				{ id: 18, label: 'Bus18' },
				{ id: 19, label: 'Bus19' },
				{ id: 20, label: 'Bus20' },
				{ id: 21, label: 'Bus21' },
				{ id: 22, label: 'Bus22' },
				{ id: 23, label: 'Bus23' },
				{ id: 24, label: 'Bus24' },
			],
			width: 6,
			default: 1,
		},
		{
			type: 'dropdown',
			id: 'MixBusEnd',
			label: 'MixMatrix Bus Range End index',
			choices: [
				{ id: 1, label: 'Bus1' },
				{ id: 2, label: 'Bus2' },
				{ id: 3, label: 'Bus3' },
				{ id: 4, label: 'Bus4' },
				{ id: 5, label: 'Bus5' },
				{ id: 6, label: 'Bus6' },
				{ id: 7, label: 'Bus7' },
				{ id: 8, label: 'Bus8' },
				{ id: 9, label: 'Bus9' },
				{ id: 10, label: 'Bus10' },
				{ id: 11, label: 'Bus11' },
				{ id: 12, label: 'Bus12' },
				{ id: 13, label: 'Bus13' },
				{ id: 14, label: 'Bus14' },
				{ id: 15, label: 'Bus15' },
				{ id: 16, label: 'Bus16' },
				{ id: 17, label: 'Bus17' },
				{ id: 18, label: 'Bus18' },
				{ id: 19, label: 'Bus19' },
				{ id: 20, label: 'Bus20' },
				{ id: 21, label: 'Bus21' },
				{ id: 22, label: 'Bus22' },
				{ id: 23, label: 'Bus23' },
				{ id: 24, label: 'Bus24' },
			],
			width: 6,
			default: 1,
		},
	]
}
