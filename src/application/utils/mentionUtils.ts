import { UserRepository } from '@/infrastructure/repositories/UserRepository';
import { FeatureFlagService } from '../services/admin/FeatureFlagService';

/**
 * Parses @mentions from text and resolves them to user IDs.
 */
export async function parseMentions(text: string): Promise<string[]> {
  const isEnabled = await FeatureFlagService.isEnabled('mentions');
  if (!isEnabled) return [];

  const mentionMatches = text.match(/@(\w+)/g) || [];
  const uniqueUserIds: string[] = [];

  for (const match of mentionMatches) {
    const username = match.substring(1);
    try {
      const user = await UserRepository.findByProperty({ username });
      if (user && !uniqueUserIds.includes(user.id)) {
        uniqueUserIds.push(user.id);
      }
    } catch (err) {
      console.error("[MENTION_RESOLUTION_FAILED]", { username });
    }
  }

  return uniqueUserIds;
}
