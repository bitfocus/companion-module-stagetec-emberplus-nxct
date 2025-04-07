import { InstanceBase, InstanceStatus, SomeCompanionConfigField, runEntrypoint } from '@companion-module/base'
import { GetActionsList } from './actions'
import { EmberPlusConfig, GetConfigFields } from './config'
import { curr_feedbacks, GetFeedbacksList } from './feedback'
import { EmberPlusState } from './state'
import { EmberClient } from 'node-emberplus/lib/client/ember-client' // note - emberplus-conn is in parent repo, not sure if it needs to be defined as dependency
import { GetVariablesList } from './variables'
import { TreeNode } from 'node-emberplus/lib/common/tree-node'

/**
 * Companion instance class for generic EmBER+ Devices
 */
class EmberPlusInstance extends InstanceBase<EmberPlusConfig> {
	private emberClient!: EmberClient
	private config!: EmberPlusConfig
	private state!: EmberPlusState

	// Override base types to make types stricter
	public checkFeedbacks(...feedbackTypes: string[]): void {
		// todo - arg should be of type FeedbackId
		super.checkFeedbacks(...feedbackTypes)
	}

	/**
	 * Main initialization function called once the module
	 * is OK to start doing things.
	 */
	public async init(config: EmberPlusConfig): Promise<void> {
		this.config = config
		this.state = new EmberPlusState()

		this.setupParseFilters()
		this.updateCompanionBits()
		this.setupEmberConnection()
	}

	/**
	 * Process an updated configuration array.
	 */
	public async configUpdated(config: EmberPlusConfig): Promise<void> {
		this.config = config

		this.emberClient.removeAllListeners()

		this.setupParseFilters()
		this.updateCompanionBits()
		this.setupEmberConnection()
	}

	/**
	 * Creates the configuration fields for web config.
	 */
	public getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	/**
	 * Clean up the instance before it is destroyed.
	 */
	public async destroy(): Promise<void> {
		await this.emberClient.disconnectAsync()
	}

	private updateCompanionBits(): void {
		this.setActionDefinitions(GetActionsList(this, this.client, this.config))
		this.setFeedbackDefinitions(GetFeedbacksList(this, this.client, this.config))
		this.setVariableDefinitions(GetVariablesList(this.config))
	}

	private get client(): EmberClient {
		return this.emberClient
	}

	private setupEmberConnection(): void {
		this.log('debug', 'connecting ' + (this.config.host || '') + ':' + this.config.port)
		this.updateStatus(InstanceStatus.Connecting)

		this.emberClient = new EmberClient({ host: this.config.host || '', port: this.config.port, timeoutValue: 5000 })
		this.emberClient.on('error', (e) => {
			this.log('error', 'Error ' + e)
		})
		this.emberClient.on('connected', () => {
			Promise.resolve()
				.then(async () => {
					await this.emberClient.getDirectoryAsync()
					this.log('debug', 'AutoParse for Parameters ...')
					await this.handleEmberTreeParsing(this.emberClient.root, '', 0)
					this.updateCompanionBits()
					this.log('debug', 'Finished ...')
					this.updateStatus(InstanceStatus.Ok)
				})
				.catch((e) => {
					// get root
					this.updateStatus(InstanceStatus.ConnectionFailure)
					this.log('error', 'Failed to discover root or subscribe to path: ' + e)
				})
		})
		this.emberClient.on('disconnected', () => {
			this.updateStatus(InstanceStatus.Connecting)
		})
		this.emberClient.connectAsync().catch((e) => {
			this.updateStatus(InstanceStatus.ConnectionFailure)
			this.log('error', 'Error ' + e)
		})
	}

	private setupParseFilters(): void {
		this.config.monitoredParameters = []
		this.config.parseNodeFilter = []
		this.config.OutputSources = []
		this.config.InputProcSources = []
		this.config.HPSources = []
		this.config.MicHPF = []
		// add Snaphot Parameter by default
		this.config.parseNodeFilter.push({ path: 'System.Snapshot', elements: 'System.Snapshot'.split('.') })
		if (this.config.micIn)
			this.config.parseNodeFilter.push({ path: 'Audio.Inputs.Mic', elements: 'Audio.Inputs.Mic'.split('.') })
		if (this.config.AnalogOut)
			this.config.parseNodeFilter.push({ path: 'Audio.Outputs.Analog', elements: 'Audio.Outputs.Analog'.split('.') })
		if (this.config.AES3In)
			this.config.parseNodeFilter.push({ path: 'Audio.Inputs.AESEBU', elements: 'Audio.Inputs.AESEBU'.split('.') })
		if (this.config.AES3Out)
			this.config.parseNodeFilter.push({ path: 'Audio.Outputs.AESEBU', elements: 'Audio.Outputs.AESEBU'.split('.') })
		if (this.config.AoIPIn)
			this.config.parseNodeFilter.push({ path: 'Audio.Inputs.AoIP', elements: 'Audio.Inputs.AoIP'.split('.') })
		if (this.config.AoIPOut)
			this.config.parseNodeFilter.push({ path: 'Audio.Outputs.AoIP', elements: 'Audio.Outputs.AoIP'.split('.') })
		if (this.config.HPOut)
			this.config.parseNodeFilter.push({ path: 'Audio.Outputs.HP', elements: 'Audio.Outputs.HP'.split('.') })
		if (this.config.InputProc)
			this.config.parseNodeFilter.push({
				path: 'Audio.Processing.InputProcessing',
				elements: 'Audio.Processing.InputProcessing'.split('.'),
			})
		if (this.config.OutputProc)
			this.config.parseNodeFilter.push({
				path: 'Audio.Processing.OutputProcessing',
				elements: 'Audio.Processing.OutputProcessing'.split('.'),
			})
		if (this.config.MixMatrix) {
			this.config.parseNodeFilter.push({ path: 'Audio.MixMatrix.Bus', elements: 'Audio.MixMatrix.Bus'.split('.') })
		}
	}

	private async handleChangedValue(path: string, node: TreeNode) {
		if (node.isParameter()) {
			// check if enumeration value
			if (node.getJSONContent()['enumeration'] !== undefined) {
				// store available sources for selections in actions
				if (path.includes('HP') && this.config.HPSources?.length == 0) {
					this.config.HPSources = node.getJSONContent()['enumeration'].split('\n')
				} else if (path.includes('InputProcessing') && this.config.InputProcSources?.length == 0) {
					this.config.InputProcSources = node.getJSONContent()['enumeration'].split('\n')
				} else if (path.includes('Outputs') && this.config.OutputSources?.length == 0) {
					this.config.OutputSources = node.getJSONContent()['enumeration'].split('\n')
				} else if (path.includes('HPF') && this.config.MicHPF?.length == 0) {
					this.config.MicHPF = node.getJSONContent()['enumeration'].split('\n')
				}
				const curr_value = node.getJSONContent()['value']
				const enumValues = node.getJSONContent()['enumeration'].split('\n')
				this.state.parameters.set(path, enumValues.at(curr_value as number) ?? '')
			} else {
				// check if integer value has factor to be applied
				if (node.getJSONContent()['factor'] !== undefined) {
					const curr_value = (node.getJSONContent()['value'] as number) / node.getJSONContent()['factor']
					this.state.parameters.set(path, curr_value.toString() ?? '')
				} else {
					this.state.parameters.set(path, node.getJSONContent()['value'] ?? '')
				}
			}
			for (const [key] of Object.entries(curr_feedbacks)) {
				this.checkFeedbacks(key)
			}

			this.setVariableValues({ [path]: this.state.parameters.get(path) })
		}
	}

	private async handleEmberTreeParsing(node: TreeNode, identifiers: string, depth: number) {
		this.config.monitoredParameters ??= []

		if (node.isRoot() || node.isNode()) {
			if (node.hasChildren()) {
				for (const child of node.getChildren() ?? []) {
					const curr_child = child as TreeNode
					const identifier = curr_child.getJSONContent()['identifier']?.replace('#', '')

					// ignore Meterings
					if (
						identifier == 'Metering' ||
						identifier == 'Compressor' ||
						identifier == 'Equalizer' ||
						identifier == 'Expander' ||
						identifier == 'Limiter' ||
						identifier == 'Delay'
					)
						continue

					// check if node is online
					if (curr_child.isNode() && !curr_child.getJSONContent()['isOnline']) continue

					if (this.config.parseNodeFilter && this.config.parseNodeFilter.length) {
						for (const entry of this.config.parseNodeFilter) {
							if (
								entry.elements.length <= depth ||
								(depth < entry.elements.length && identifier.includes(entry.elements[depth]))
							) {
								if (identifier.includes('Bus') && this.config.MixBusStart && this.config.MixBusEnd) {
									const busNum = curr_child.getJSONContent()['identifier']?.split('#').pop() as number
									if (
										busNum < this.config.MixBusStart ||
										busNum > this.config.MixBusEnd ||
										busNum - this.config.MixBusStart > 3
									)
										break
								}
								if (curr_child.isNode()) {
									await this.emberClient.getDirectoryAsync(curr_child)
								}
								if (identifiers == '') {
									await this.handleEmberTreeParsing(curr_child, identifier || '', depth + 1)
								} else {
									await this.handleEmberTreeParsing(curr_child, identifiers + '.' + identifier || '', depth + 1)
								}
								break
							}
						}
					}
				}
			}
		} else if (node.isParameter()) {
			try {
				for (const nodeFilter of this.config.parseNodeFilter ?? []) {
					if (identifiers.startsWith(nodeFilter.path)) {
						await this._addMonitoredParameter(node, identifiers)
						return
					}
				}
			} catch (e) {
				this.log('error', 'Failed to subscribe to path "' + identifiers + '": ' + e)
			}
		}
	}

	private async _addMonitoredParameter(paramNode: TreeNode, label: string) {
		this.config.monitoredParameters!.push({ id: paramNode.getJSONContent()['path'] ?? '', label: label })

		this.setVariableDefinitions(GetVariablesList(this.config))

		paramNode.getDirectory((node) => {
			this.handleChangedValue(label, node).catch((e) => this.log('error', 'Error handling parameter ' + e))
		})
		//this.log('debug', 'Registered for path "' + label + '"')
		await this.handleChangedValue(label, paramNode)
	}
}

runEntrypoint(EmberPlusInstance, [])
