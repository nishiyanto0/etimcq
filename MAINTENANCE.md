# Project Maintenance & Integrity

## 🚨 CRITICAL RULE: User Reports First
Every time a new maintenance session or chat begins, the first priority is to check the `reports` table in the InsForge database for any user-submitted bug reports or content errors.

### Workflow:
1.  **Fetch Reports**: Use the InsForge MCP tool or SQL query to pull latest entries from the `reports` table.
2.  **Verify, Don't Blindly Trust**: 
    *   Review the `user_comment` and `question_text`.
    *   Cross-check the report against technical documentation or known best practices.
    *   **IF THE REPORT IS RIGHT**: Fix the question in the corresponding JSON file (`data/*.json`).
    *   **IF THE REPORT IS WRONG**: Ignore it but note the confusion (maybe update the explanation to be clearer).
3.  **Update Content**: Modify `correct` index, `correctText`, or `explanation` as needed.
4.  **Acknowledge**: (Optional) In a real system, you'd mark the report as resolved. Here, ensure the JSON is perfectly synced.

## Content Quality Standards
*   **Banner Security**: Standard practice is to remove or mask server version/identity info.
*   **Protocol Ports**: 802.11 (WiFi), 802.15.4 (Zigbee), etc.
*   **Strict Search**: Always use word boundaries (`\b`) for technical terms.
