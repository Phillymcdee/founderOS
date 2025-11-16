# Ideas & Validation Domain - Testing Checklist

## ✅ Phase 1 Review & Testing

### ✅ Automated Backend Tests (PASSING)
Run `npm test` to execute all automated tests.

**Status: 19/19 tests passing** ✅

### Signal Ingestion Flow
- [x] **Apify Integration** ✅ (Automated)
  - [x] Apify sources configured (6 sources)
  - [x] Signal ingestion works
  - [x] Duplicate prevention works
  - [ ] Run `npm run ideas:schedule` to create QStash schedule (Manual)
  - [ ] Manually trigger: `npx ts-node scripts/testIdeasTrigger.ts` (Manual)
  - [ ] Check database: `node scripts/showLatestIdeas.js` (Manual)

- [ ] **Signal Sources**
  - [ ] LinkedIn job scrapers (RevOps, Support Ops, Finance Ops) return data
  - [ ] Reddit scrapers (Support pain, Agency reporting) return data
  - [ ] G2 reviews scraper returns data
  - [ ] Verify `maxItems` limits are respected

### Idea Generation Flow
- [x] **Problem Mapper** ✅ (Automated)
  - [x] Verify keyword-based clustering works
  - [x] Check that ideas are generated from signals
  - [x] Verify idea templates match expected categories
  - [x] Test with empty signal set (should return empty array)

- [x] **Auto-Scoring** ✅ (Automated)
  - [x] Verify ideas are automatically scored when created
  - [x] Check hard filters are applied correctly
  - [x] Verify 4-axis scoring (pain, agent leverage, data surface, repeatability)
  - [x] Check initial state is set correctly (KILLED/SCORING/EXPERIMENTING)

### Experiment Flow
- [x] **Experiment Designer** ✅ (Automated)
  - [x] Verify experiments are auto-designed for ideas in EXPERIMENTING state
  - [x] Check SIGNAL test is always created
  - [x] Verify WORKFLOW test is created for high agent-fit ideas
  - [x] Verify AGENT_OWNERSHIP test is created for high-scoring ideas
  - [ ] Run experiment loop: Click "Run experiment loop" button (Manual UI test)

- [x] **Experiment Interpreter** ✅ (Automated)
  - [x] Verify interpreter analyzes results
  - [x] Verify idea state updates based on experiment results
  - [ ] Manually log experiments with different results (Manual UI test)
  - [ ] Test with "FAILED" result (Manual UI test)
  - [ ] Test with "INCONCLUSIVE" result (Manual UI test)

- [x] **State Transitions** ✅ (Automated)
  - [x] Verify ideas move to VALIDATED when all experiments pass
  - [ ] Verify ideas move to KILLED when experiments fail (Manual UI test)
  - [ ] Check notification appears when idea reaches VALIDATED (Manual UI test)

### UI/UX Testing
- [ ] **Kanban Board**
  - [ ] Verify all state columns display correctly
  - [ ] Test drag-and-drop between columns
  - [ ] Verify visual feedback during drag (opacity, border highlight)
  - [ ] Check state updates persist after drop
  - [ ] Verify column counts update correctly

- [ ] **Idea Cards**
  - [ ] Click card to expand details
  - [ ] Verify side panels for signals expand/collapse
  - [ ] Verify side panels for experiments expand/collapse
  - [ ] Check score badges display correctly
  - [ ] Verify filter statuses show correct checkmarks/X marks

- [ ] **Notifications**
  - [ ] Drag idea to VALIDATED state
  - [ ] Verify success notification appears
  - [ ] Verify notification auto-dismisses after 5 seconds
  - [ ] Test manual dismiss (click X)
  - [ ] Test error notification (disconnect network, try state change)

- [ ] **Buttons & Actions**
  - [ ] "Discover new ideas" button works
  - [ ] "Auto-score all ideas" button works
  - [ ] "Run experiment loop" button works
  - [ ] Verify page refreshes after actions complete

### Data Integrity
- [x] **Database** ✅ (Automated)
  - [x] Verify all ideas have required fields
  - [x] Check sourceSignalIds array is populated correctly
  - [x] Verify experiments are linked to ideas correctly
  - [x] Check events are logged for all major actions

- [x] **State Consistency** ✅ (Automated)
  - [x] Verify ideas can't be in invalid states
  - [ ] Check state transitions are logged in events (Manual verification)
  - [ ] Verify ideaIntentVersion is tracked in events (Manual verification)

### Edge Cases
- [ ] **Empty States**
  - [ ] Test with no signals
  - [ ] Test with no ideas
  - [ ] Test with ideas but no experiments

- [ ] **Error Handling**
  - [ ] Test with invalid Apify token
  - [ ] Test with network failure
  - [ ] Test with invalid idea ID
  - [ ] Verify graceful error messages

### Performance
- [ ] **Load Times**
  - [ ] Page loads in < 2 seconds
  - [ ] Drag-and-drop is responsive
  - [ ] API calls complete in < 5 seconds

- [ ] **Scalability**
  - [ ] Test with 100+ ideas
  - [ ] Test with 50+ signals
  - [ ] Verify pagination/limiting works

## 🐛 Known Issues to Verify
- [ ] Check if QStash local proxy is still running
- [ ] Verify environment variables are set correctly
- [ ] Check browser console for errors
- [ ] Verify TypeScript compilation succeeds

## 📊 Success Criteria
- ✅ All 6 Apify sources return data
- ✅ Ideas are auto-generated and scored
- ✅ Experiments are auto-designed and interpreted
- ✅ Drag-and-drop works smoothly
- ✅ Notifications appear for state changes
- ✅ No console errors
- ✅ Database integrity maintained

---

## Next Steps After Testing

If all tests pass:
1. **Move to Phase 2: Ops/GTM Domain**
   - Implement Weekly Founder Summary flow
   - Add Metrics Aggregation Agent
   - Add Founder Summary Agent
   - Build Business dashboard

If issues found:
1. Document bugs
2. Fix critical issues first
3. Re-test affected areas
4. Then proceed to Phase 2

