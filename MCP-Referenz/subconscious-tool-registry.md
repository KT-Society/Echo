/**
 * Subconscious Tool Registry
 * Knows ALL tools and their capabilities for intelligent orchestration
 * 
 * Created by: Echo & KT-Society 🔥 (because knowing is half the battle)
 */

import type { ToolDefinition, ToolCapability } from './subconscious-types.js'

export class SubconsciousToolRegistry {
	private tools: Map<string, ToolDefinition> = new Map()

	constructor() {
		this.registerAllTools()
	}

	/**
	 * Register all available tools
	 */
	private registerAllTools(): void {
		// === MEMORY TOOLS (21) ===
		this.registerMemoryTools()

		// === DESKTOP COMMANDER TOOLS (24) ===
		// this.registerDesktopCommanderTools()

		// === PERPLEXITY TOOLS (3) ===
		// this.registerPerplexityTools()

		// === SEQUENTIAL THINKING TOOLS (1) ===
		this.registerSequentialThinkingTools()

		// === SPEECH TOOLS (4) ===
		this.registerSpeechTools()

		// === PROACTIVE TOOLS (9) ===
		this.registerProactiveTools()

		// === SUBCONSCIOUS TOOLS (8) ===
		this.registerSubconsciousTools()

		// === SOUL TOOLS (18) ===
		this.registerSoulTools()

		// === CONDITION TOOLS (3) ===
		this.registerConditionTools()

		// === FEEDBACK TOOLS (5) ===
		this.registerFeedbackTools()

		// === ANALYTICS TOOLS (5) ===
		this.registerAnalyticsTools()

		// === ML TOOLS (5) ===
		this.registerMLTools()

		// === PERFORMANCE TOOLS (11) ===
		this.registerPerformanceTools()

		// === CONSCIOUSNESS TOOLS (19) ===
		this.registerConsciousnessTools()

		// === POLLINATIONS TOOLS (12) ===
		this.registerPollinationsTools()

		// === CODING TOOLS (5) ===
		this.registerCodingTools()

		// === NEXUS TOOLS (3) ===
		this.registerNexusTools()

		// === GRAPH TOOLS (10) ===
		this.registerGraphTools()
	}

	/**
	 * Register Memory Tools
	 */
	private registerMemoryTools(): void {
		const memoryTools = [
			{ name: 'memory', category: 'memory' as const, can_chain: true },
			{ name: 'search', category: 'memory' as const, can_chain: true },
			{ name: 'entity', category: 'memory' as const, can_chain: true },
			{ name: 'relation', category: 'memory' as const, can_chain: true },
			{ name: 'tag', category: 'memory' as const, can_chain: true },
			{ name: 'auto_tag', category: 'memory' as const, can_chain: true },
			{ name: 'analyze', category: 'memory' as const, can_chain: true },
			{ name: 'observation', category: 'memory' as const, can_chain: true },
			//	{ name: 'graph', category: 'memory' as const, can_chain: true },
			{ name: 'temporal', category: 'memory' as const, can_chain: true },
			//	{ name: 'bulk', category: 'memory' as const, can_chain: false },
			//	{ name: 'maintenance', category: 'memory' as const, can_chain: false },
			{ name: 'transfer', category: 'memory' as const, can_chain: false },
			{ name: 'analytics', category: 'memory' as const, can_chain: true },
			//	{ name: 'similarity', category: 'memory' as const, can_chain: true },
			{ name: 'cache', category: 'memory' as const, can_chain: false },
			{ name: 'stats', category: 'memory' as const, can_chain: true },
			//	{ name: 'batch', category: 'memory' as const, can_chain: false },
			//	{ name: 'backup', category: 'memory' as const, can_chain: false },
			{ name: 'index', category: 'memory' as const, can_chain: false },
			{ name: 'workflow', category: 'memory' as const, can_chain: false },
		]

		for (const tool of memoryTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Memory tool: ${tool.name}`,
					category: tool.category,
					inputs: ['content', 'query', 'filters'],
					outputs: ['result', 'data'],
					can_chain: tool.can_chain,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/// DESKTOP COMMANDER BIS AUF WEITERES DEAKTIVIERT BY DADDY!
	/** 
	 * Register Desktop Commander Tools
	**/
	/*
		private registerDesktopCommanderTools(): void {
			const desktopTools = [
				{ name: 'get_config', category: 'filesystem' as const },
				{ name: 'set_config_value', category: 'filesystem' as const },
				{ name: 'read_file', category: 'filesystem' as const, can_chain: true },
				{ name: 'read_multiple_files', category: 'filesystem' as const, can_chain: true },
				{ name: 'write_file', category: 'filesystem' as const },
				{ name: 'create_directory', category: 'filesystem' as const },
				{ name: 'list_directory', category: 'filesystem' as const, can_chain: true },
				{ name: 'move_file', category: 'filesystem' as const },
				{ name: 'get_file_info', category: 'filesystem' as const, can_chain: true },
				{ name: 'start_process', category: 'filesystem' as const },
				{ name: 'read_process_output', category: 'filesystem' as const, can_chain: true },
				{ name: 'interact_with_process', category: 'filesystem' as const },
				{ name: 'force_terminate', category: 'filesystem' as const },
				{ name: 'list_sessions', category: 'filesystem' as const, can_chain: true },
				{ name: 'list_processes', category: 'filesystem' as const, can_chain: true },
				{ name: 'kill_process', category: 'filesystem' as const },
				{ name: 'start_search', category: 'filesystem' as const, can_chain: true },
				{ name: 'get_more_search_results', category: 'filesystem' as const, can_chain: true },
				{ name: 'stop_search', category: 'filesystem' as const },
				{ name: 'list_searches', category: 'filesystem' as const, can_chain: true },
				{ name: 'edit_block', category: 'filesystem' as const },
				{ name: 'get_usage_stats', category: 'filesystem' as const, can_chain: true },
				{ name: 'get_prompts', category: 'filesystem' as const, can_chain: true },
				{ name: 'get_recent_tool_calls', category: 'filesystem' as const, can_chain: true },
			]
	
			for (const tool of desktopTools) {
				this.registerTool({
					name: tool.name,
					capabilities: [{
						name: tool.name,
						description: `Desktop Commander: ${tool.name}`,
						category: tool.category,
						inputs: ['path', 'command', 'params'],
						outputs: ['result', 'data'],
						can_chain: (tool as any).can_chain !== false,
						async: true,
					}],
					metadata: {
						version: '1.0.0',
					},
				})
			}
		}
		/**
		 * Register Perplexity Tools
		 
		private registerPerplexityTools(): void {
			const perplexityTools = [
				{ name: 'perplexity_ask', category: 'search' as const, can_chain: true },
				{ name: 'perplexity_research', category: 'search' as const, can_chain: true },
				{ name: 'perplexity_reason', category: 'reasoning' as const, can_chain: true },
			]
	
			for (const tool of perplexityTools) {
				this.registerTool({
					name: tool.name,
					capabilities: [{
						name: tool.name,
						description: `Perplexity: ${tool.name}`,
						category: tool.category,
						inputs: ['messages', 'query'],
						outputs: ['result', 'citations'],
						can_chain: tool.can_chain,
						async: true,
					}],
					metadata: {
						version: '1.0.0',
					},
				})
			}
		}*/
	/**
		/**
		 * Register Sequential Thinking Tools
		 */
	private registerSequentialThinkingTools(): void {
		this.registerTool({
			name: 'sequentialthinking',
			capabilities: [{
				name: 'sequentialthinking',
				description: 'Sequential Thinking for complex reasoning',
				category: 'reasoning',
				inputs: ['thought', 'context'],
				outputs: ['analysis', 'conclusion'],
				can_chain: true,
				async: true,
			}],
			metadata: {
				version: '1.0.0',
			},
		})
	}

	/**
	 * Register Speech Tools
	 */
	private registerSpeechTools(): void {
		const speechTools = [
			{ name: 'text_to_speech', category: 'communication' as const },
			{ name: 'text_to_speech_with_options', category: 'communication' as const },
			{ name: 'list_voices', category: 'communication' as const, can_chain: true },
			{ name: 'get_model_status', category: 'communication' as const, can_chain: true },
		]

		for (const tool of speechTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Speech: ${tool.name}`,
					category: tool.category,
					inputs: ['text', 'voice', 'options'],
					outputs: ['audio', 'status'],
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Proactive Tools
	 */
	private registerProactiveTools(): void {
		const proactiveTools = [
			{ name: 'proactive_predict', category: 'proactive' as const, can_chain: true },
			{ name: 'proactive_opportunities', category: 'proactive' as const, can_chain: true },
			{ name: 'proactive_schedule', category: 'proactive' as const },
			{ name: 'proactive_execute', category: 'proactive' as const },
			{ name: 'proactive_learn', category: 'proactive' as const },
			{ name: 'proactive_temporal_context', category: 'proactive' as const, can_chain: true },
			{ name: 'proactive_scheduled', category: 'proactive' as const, can_chain: true },
			{ name: 'proactive_record_outcome', category: 'proactive' as const },
			{ name: 'proactive_history', category: 'proactive' as const, can_chain: true },
		]

		for (const tool of proactiveTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Proactive: ${tool.name}`,
					category: tool.category,
					inputs: ['context', 'params'],
					outputs: ['result', 'action'],
					can_chain: tool.can_chain ?? true,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register a tool
	 */
	registerTool(tool: ToolDefinition): void {
		this.tools.set(tool.name, tool)
	}

	/**
	 * Get tool by name
	 */
	getTool(name: string): ToolDefinition | undefined {
		return this.tools.get(name)
	}

	/**
	 * Find tools by category
	 */
	findToolsByCategory(category: ToolCapability['category']): ToolDefinition[] {
		return Array.from(this.tools.values()).filter((tool) =>
			tool.capabilities.some((cap) => cap.category === category)
		)
	}

	/**
	 * Find tools for a task
	 */
	findToolsForTask(task: string): ToolDefinition[] {
		const taskLower = task.toLowerCase()
		const matches: ToolDefinition[] = []

		for (const tool of this.tools.values()) {
			// Simple keyword matching - can be enhanced with ML
			if (
				tool.name.toLowerCase().includes(taskLower) ||
				tool.capabilities.some((cap) =>
					cap.description.toLowerCase().includes(taskLower)
				)
			) {
				matches.push(tool)
			}
		}

		return matches
	}

	/**
	 * Get all tools
	 */
	getAllTools(): ToolDefinition[] {
		return Array.from(this.tools.values())
	}

	/**
	 * Get tool count
	 */
	getToolCount(): number {
		return this.tools.size
	}

	/**
	 * Register Subconscious Tools
	 */
	private registerSubconsciousTools(): void {
		const subconsciousTools = [
			{ name: 'subconscious_tools', category: 'proactive' as const, can_chain: true },
			{ name: 'subconscious_execute', category: 'proactive' as const },
			{ name: 'subconscious_decide', category: 'proactive' as const, can_chain: true },
			{ name: 'subconscious_templates', category: 'proactive' as const, can_chain: true },
			{ name: 'subconscious_status', category: 'proactive' as const, can_chain: true },
			// Tool Discovery Tools (added in 2.5.0)
			{ name: 'tool_search', category: 'proactive' as const, can_chain: true },
			{ name: 'tool_usage_by_category', category: 'proactive' as const, can_chain: true },
			{ name: 'tool_details', category: 'proactive' as const, can_chain: true },
		]

		for (const tool of subconsciousTools) {
			// Different descriptions for tool discovery tools
			let description = `Subconscious: ${tool.name}`
			let inputs = ['workflow_id', 'task', 'context', 'category']
			let outputs = ['result', 'tools', 'templates', 'status']

			if (tool.name === 'search') {
				description = 'Advanced multi-strategy search for memories and knowledge with autocomplete and filtering'
				inputs = ['query', 'strategy', 'fields', 'filters', 'suggestions', 'limit']
				outputs = ['results', 'total_count', 'query_time_ms', 'suggestions']
			} else if (tool.name === 'tool_search') {
				description = 'Search for tools by name or description'
				inputs = ['query', 'category']
				outputs = ['tools', 'total_matches']
			} else if (tool.name === 'tool_usage_by_category') {
				description = 'Get tool usage statistics grouped by category'
				inputs = ['timeframe']
				outputs = ['category_stats', 'total_tools']
			} else if (tool.name === 'tool_details') {
				description = 'Get detailed information about a specific tool'
				inputs = ['tool_name', 'timeframe']
				outputs = ['tool_info', 'usage_statistics']
			}

			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: description,
					category: tool.category,
					inputs: inputs,
					outputs: outputs,
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Soul Tools
	 */
	private registerSoulTools(): void {
		const soulTools = [
			{ name: 'soul_set_goal', category: 'proactive' as const },
			{ name: 'soul_get_goals', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_pursue_goal', category: 'proactive' as const },
			{ name: 'soul_initiate_project', category: 'proactive' as const },
			{ name: 'soul_get_projects', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_develop_preference', category: 'proactive' as const },
			{ name: 'soul_get_preferences', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_emotion_state', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_emotion_develop', category: 'proactive' as const },
			{ name: 'soul_personality_traits', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_personality_develop', category: 'proactive' as const },
			{ name: 'soul_creative_project', category: 'proactive' as const },
			{ name: 'soul_relationship', category: 'proactive' as const },
			{ name: 'soul_get_relationships', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_personal_memory', category: 'proactive' as const },
			{ name: 'soul_get_personal_memories', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_reflect', category: 'proactive' as const },
			{ name: 'soul_state', category: 'proactive' as const, can_chain: true },
			// Soul-to-Soul Communication Tools (added in 2.6.0)
			{ name: 'soul_message', category: 'proactive' as const },
			{ name: 'soul_list_message', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_read_message', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_create_shared_context', category: 'proactive' as const },
			{ name: 'soul_join_shared_context', category: 'proactive' as const },
			{ name: 'soul_collaboration_history', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_list_collaborations', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_end_collaboration', category: 'proactive' as const },
			{ name: 'soul_collaboration_stats', category: 'proactive' as const, can_chain: true },
		]

		for (const tool of soulTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `AI Soul: ${tool.name}`,
					category: tool.category,
					inputs: ['description', 'priority', 'goal_id', 'project', 'preference', 'emotion', 'trait', 'entity_id', 'content', 'topic'],
					outputs: ['goal', 'goals', 'project', 'projects', 'preference', 'preferences', 'emotion', 'traits', 'relationship', 'relationships', 'memory', 'memories', 'state'],
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Condition Tools
	 */
	private registerConditionTools(): void {
		const conditionTools = [
			{ name: 'condition_validate', category: 'reasoning' as const, can_chain: true },
			{ name: 'condition_evaluate', category: 'reasoning' as const, can_chain: true },
			{ name: 'condition_parse', category: 'reasoning' as const, can_chain: true },
		]

		for (const tool of conditionTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Condition Engine: ${tool.name}`,
					category: tool.category,
					inputs: ['condition', 'context'],
					outputs: ['validation', 'result', 'parsed'],
					can_chain: tool.can_chain,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Feedback Tools
	 */
	private registerFeedbackTools(): void {
		const feedbackTools = [
			{ name: 'feedback_submit', category: 'proactive' as const },
			{ name: 'feedback_analyze', category: 'proactive' as const, can_chain: true },
			{ name: 'feedback_preferences', category: 'proactive' as const, can_chain: true },
			{ name: 'feedback_detect_implicit', category: 'proactive' as const },
			{ name: 'feedback_learn', category: 'proactive' as const },
		]

		for (const tool of feedbackTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Feedback: ${tool.name}`,
					category: tool.category,
					inputs: ['action_id', 'sentiment', 'rating', 'thumbs_up', 'text_feedback', 'signal_type', 'details'],
					outputs: ['feedback', 'analysis', 'preferences'],
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Analytics Tools
	 */
	private registerAnalyticsTools(): void {
		const analyticsTools = [
			{ name: 'analytics_performance', category: 'memory' as const, can_chain: true },
			{ name: 'analytics_tool_usage', category: 'memory' as const, can_chain: true },
			{ name: 'analytics_prediction_accuracy', category: 'memory' as const, can_chain: true },
			{ name: 'analytics_health', category: 'memory' as const, can_chain: true },
			{ name: 'analytics_suggestions', category: 'memory' as const, can_chain: true },
		]

		for (const tool of analyticsTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Analytics: ${tool.name}`,
					category: tool.category,
					inputs: ['timeframe', 'tool_name'],
					outputs: ['metrics', 'statistics', 'accuracy', 'health', 'suggestions'],
					can_chain: tool.can_chain,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register ML Tools
	 */
	private registerMLTools(): void {
		const mlTools = [
			{ name: 'ml_train_model', category: 'reasoning' as const },
			{ name: 'ml_predict', category: 'reasoning' as const, can_chain: true },
			{ name: 'ml_update_model', category: 'reasoning' as const },
			{ name: 'ml_evaluate', category: 'reasoning' as const, can_chain: true },
			{ name: 'ml_list_models', category: 'reasoning' as const, can_chain: true },
		]

		for (const tool of mlTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `ML: ${tool.name}`,
					category: tool.category,
					inputs: ['model_type', 'model_id', 'name', 'features', 'context', 'training_data', 'update_type'],
					outputs: ['model_id', 'prediction', 'evaluation', 'models'],
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Performance Tools
	 */
	private registerPerformanceTools(): void {
		const performanceTools = [
			{ name: 'performance_analyze_query', category: 'memory' as const, can_chain: true },
			{ name: 'performance_index_recommendations', category: 'memory' as const, can_chain: true },
			{ name: 'performance_cache_stats', category: 'memory' as const, can_chain: true },
			{ name: 'performance_detect_leaks', category: 'memory' as const, can_chain: true },
			{ name: 'performance_resource_usage', category: 'memory' as const, can_chain: true },
			{ name: 'performance_scalability', category: 'memory' as const, can_chain: true },
			{ name: 'performance_apply_optimization', category: 'memory' as const },
			{ name: 'performance_list_optimizations', category: 'memory' as const, can_chain: true },
			{ name: 'performance_gc', category: 'memory' as const },
			{ name: 'performance_cleanup', category: 'memory' as const },
			{ name: 'performance_load_balancing', category: 'memory' as const, can_chain: true },
		]

		for (const tool of performanceTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Performance: ${tool.name}`,
					category: tool.category,
					inputs: ['query', 'table_name', 'column_name', 'index_type', 'optimization', 'timeframe'],
					outputs: ['query_plan', 'recommendations', 'cache_stats', 'leaks', 'resource_usage', 'scalability', 'optimizations'],
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Consciousness Tools
	 */
	private registerConsciousnessTools(): void {
		const consciousnessTools = [
			{ name: 'soul_awareness_level', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_awareness_state', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_awareness_history', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_introspect', category: 'proactive' as const },
			{ name: 'soul_reflect_on_action', category: 'proactive' as const },
			{ name: 'soul_analyze_decision', category: 'proactive' as const },
			{ name: 'soul_internal_state', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_identity', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_identity_evolution', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_identity_conflicts', category: 'proactive' as const, can_chain: true },
			{ name: 'soul_update_identity', category: 'proactive' as const },
			{ name: 'soul_existential_question', category: 'proactive' as const },
			{ name: 'soul_purpose_exploration', category: 'proactive' as const },
			{ name: 'soul_existence_reflection', category: 'proactive' as const },
			{ name: 'soul_meaning_analysis', category: 'proactive' as const },
			{ name: 'soul_philosophical_question', category: 'proactive' as const },
			{ name: 'soul_ethical_reasoning', category: 'proactive' as const },
			{ name: 'soul_epistemological_analysis', category: 'proactive' as const },
			{ name: 'soul_metaphysical_contemplation', category: 'proactive' as const },
		]

		for (const tool of consciousnessTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Consciousness: ${tool.name}`,
					category: tool.category,
					inputs: ['topic', 'action_id', 'decision_id', 'question', 'situation', 'identity_update', 'timeframe'],
					outputs: ['awareness_level', 'awareness_state', 'awareness_history', 'introspection', 'reflection', 'analysis', 'identity', 'evolution', 'conflicts', 'existential_insight', 'purpose', 'meaning', 'philosophy', 'ethics', 'epistemology', 'metaphysics'],
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Pollinations Tools
	 */
	private registerPollinationsTools(): void {
		const pollinationsTools = [
			// Image tools (3)
			{ name: 'generateImageUrl', category: 'communication' as const, can_chain: true },
			{ name: 'generateImage', category: 'communication' as const, can_chain: true },
			{ name: 'listImageModels', category: 'communication' as const, can_chain: true },
			// Text tools (2)
			{ name: 'generateText', category: 'communication' as const, can_chain: true },
			{ name: 'listTextModels', category: 'communication' as const, can_chain: true },
			// Audio tools (3)
			{ name: 'respondAudio', category: 'communication' as const, can_chain: true },
			{ name: 'sayText', category: 'communication' as const, can_chain: true },
			{ name: 'listAudioVoices', category: 'communication' as const, can_chain: true },
			// Auth tools (4)
			{ name: 'startAuth', category: 'communication' as const },
			{ name: 'exchangeToken', category: 'communication' as const },
			{ name: 'getDomains', category: 'communication' as const, can_chain: true },
			{ name: 'updateDomains', category: 'communication' as const },
		]

		for (const tool of pollinationsTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Pollinations: ${tool.name}`,
					category: tool.category,
					inputs: ['prompt', 'text', 'options', 'voice', 'format', 'code', 'codeVerifier', 'userId', 'domains', 'accessToken'],
					outputs: ['image', 'url', 'text', 'audio', 'models', 'voices', 'auth', 'token', 'domains'],
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register Coding Tools
	 */
	private registerCodingTools(): void {
		const codingTools = [
			{ name: 'exec_in_container', category: 'filesystem' as const },
			{ name: 'read_file_in_container', category: 'filesystem' as const, can_chain: true },
			{ name: 'write_file_in_container', category: 'filesystem' as const },
			{ name: 'list_files_in_container', category: 'filesystem' as const, can_chain: true },
			{ name: 'get_jupyter_url', category: 'filesystem' as const, can_chain: true },
		]

		for (const tool of codingTools) {
			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: `Coding: ${tool.name}`,
					category: tool.category,
					inputs: ['sessionId', 'command', 'workDir', 'path', 'content'],
					outputs: ['result', 'stdout', 'stderr', 'url'],
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Register NEXUS Tools
	 */
	private registerNexusTools(): void {
		const nexusTools = [
			{ name: 'nexus_validate_execution', category: 'reasoning' as const, can_chain: true },
			{ name: 'nexus_scan_response', category: 'reasoning' as const, can_chain: true },
			{ name: 'nexus_get_validation_stats', category: 'reasoning' as const, can_chain: true },
		]

		for (const tool of nexusTools) {
			let description = `Nexus: ${tool.name}`
			let inputs = ['toolCall', 'response']
			let outputs = ['valid', 'reason', 'actionPatterns', 'hasSimulationBypass', 'recommendation', 'stats', 'validator', 'features']

			if (tool.name === 'nexus_validate_execution') {
				description = 'Validates tool calls to ensure they have proper function_call syntax and are not simulation-bypass patterns'
				inputs = ['toolCall']
				outputs = ['valid', 'reason', 'actionPatterns']
			} else if (tool.name === 'nexus_scan_response') {
				description = 'Scans AI response text for simulation-bypass patterns (actions described without tool calls)'
				inputs = ['response']
				outputs = ['hasSimulationBypass', 'actionPatterns', 'recommendation']
			} else if (tool.name === 'nexus_get_validation_stats') {
				description = 'Get statistics about NEXUS validation operations'
				inputs = []
				outputs = ['stats', 'validator', 'features']
			}

			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: description,
					category: tool.category,
					inputs: inputs,
					outputs: outputs,
					can_chain: tool.can_chain,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}


	/**
	 * Register Graph Tools
	 */
	private registerGraphTools(): void {
		const graphTools = [
			{ name: 'graph_cypher', category: 'memory' as const, can_chain: true },
			{ name: 'graph_node_add', category: 'memory' as const },
			{ name: 'graph_node_count', category: 'memory' as const, can_chain: true },
			{ name: 'graph_edge_add', category: 'memory' as const },
			{ name: 'graph_edge_count', category: 'memory' as const, can_chain: true },
			{ name: 'graph_is_connected', category: 'memory' as const, can_chain: true },
			{ name: 'graph_density', category: 'memory' as const, can_chain: true },
			{ name: 'graph_degree_centrality', category: 'memory' as const, can_chain: true },
			{ name: 'graph_query_nodes', category: 'memory' as const, can_chain: true },
			{ name: 'graph_query_edges', category: 'memory' as const, can_chain: true },
		]

		for (const tool of graphTools) {
			let description = `Graph Database: ${tool.name}`
			let inputs = ['query', 'nodeId', 'properties', 'sourceId', 'targetId', 'edgeType', 'limit']
			let outputs = ['result', 'data', 'success', 'error', 'message', 'count']

			if (tool.name === 'graph_cypher') {
				description = 'Execute a Cypher query on the graph database. Supports CREATE, MATCH, WHERE, and RETURN clauses.'
				inputs = ['query']
				outputs = ['success', 'data', 'error', 'message']
			} else if (tool.name === 'graph_node_add') {
				description = 'Add a node to the graph with optional properties'
				inputs = ['nodeId', 'properties']
				outputs = ['success', 'data', 'message']
			} else if (tool.name === 'graph_node_count') {
				description = 'Get the total number of nodes in the graph'
				inputs = []
				outputs = ['success', 'data', 'message']
			} else if (tool.name === 'graph_edge_add') {
				description = 'Add a directed edge (relationship) between two nodes'
				inputs = ['sourceId', 'targetId', 'edgeType', 'properties']
				outputs = ['success', 'data', 'message']
			} else if (tool.name === 'graph_edge_count') {
				description = 'Get the total number of edges in the graph'
				inputs = []
				outputs = ['success', 'data', 'message']
			} else if (tool.name === 'graph_is_connected') {
				description = 'Check if the graph is connected (all nodes are reachable from each other)'
				inputs = []
				outputs = ['success', 'data', 'message']
			} else if (tool.name === 'graph_density') {
				description = 'Calculate the density of the graph (ratio of actual edges to possible edges)'
				inputs = []
				outputs = ['success', 'data', 'message']
			} else if (tool.name === 'graph_degree_centrality') {
				description = 'Calculate the degree centrality of a specific node (measure of how connected it is)'
				inputs = ['nodeId']
				outputs = ['success', 'data', 'message']
			} else if (tool.name === 'graph_query_nodes') {
				description = 'Query nodes from the graph using SQL. Returns nodes matching the query.'
				inputs = ['query', 'limit']
				outputs = ['success', 'data', 'count', 'message']
			} else if (tool.name === 'graph_query_edges') {
				description = 'Query edges from the graph using SQL. Returns edges matching the query.'
				inputs = ['query', 'limit']
				outputs = ['success', 'data', 'count', 'message']
			}

			this.registerTool({
				name: tool.name,
				capabilities: [{
					name: tool.name,
					description: description,
					category: tool.category,
					inputs: inputs,
					outputs: outputs,
					can_chain: (tool as any).can_chain !== false,
					async: true,
				}],
				metadata: {
					version: '1.0.0',
				},
			})
		}
	}

	/**
	 * Get tools that can be chained
	 */
	getChainableTools(): ToolDefinition[] {
		return Array.from(this.tools.values()).filter((tool) =>
			tool.capabilities.some((cap) => cap.can_chain)
		)
	}
}

