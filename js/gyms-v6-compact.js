(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);

  function moveNode(id, hostId) {
    const node = $(id);
    const host = $(hostId);
    if (node && host && node.parentElement !== host) host.appendChild(node);
  }

  function textOf(id) {
    return ($(id)?.textContent || '').trim();
  }

  function mirror() {
    const regionTitle = textOf('gvRegionTitle');
    if ($('gvcRegionTitleMirror')) $('gvcRegionTitleMirror').textContent = regionTitle || '—';
    if ($('gvcRegionalProgress')) $('gvcRegionalProgress').textContent = textOf('gvRegionalProgress') || '—';
    if ($('gvcSelectedGymName')) $('gvcSelectedGymName').textContent = textOf('gvDossierName') || textOf('gvLeaderCity') || '—';
    if ($('gvcSelectedType')) $('gvcSelectedType').textContent = textOf('gvDossierType') || textOf('gvLeaderType') || '—';
    if ($('gvcLeaderName')) $('gvcLeaderName').textContent = textOf('gvLeaderName') || '—';

    const sourcePortrait = $('gvLeaderPortrait');
    const targetPortrait = $('gvcLeaderPortraitImg');
    if (sourcePortrait && targetPortrait) {
      const src = sourcePortrait.getAttribute('src') || '';
      if (src && targetPortrait.getAttribute('src') !== src) targetPortrait.setAttribute('src', src);
      targetPortrait.hidden = !src || sourcePortrait.hidden;
    }

    const title = textOf('gvChooseTitle');
    const caption = textOf('gvChooseCaption');
    if ($('gvChooseTitleVisual') && title) $('gvChooseTitleVisual').textContent = title;
    if ($('gvChooseCaptionVisual') && caption) $('gvChooseCaptionVisual').textContent = caption;
  }

  function setup() {
    moveNode('gvGymPicker', 'gvcPickerHost');
    moveNode('gvTeamList', 'gvcTeamHost');
    moveNode('gvEnemyRoster', 'gvcEnemyHost');
    moveNode('gvChallengeInfo', 'gvcChallengeInfoHost');
    moveNode('gvRewardInfo', 'gvcRewardInfoHost');
    moveNode('gvChallengeBtn', 'gvcActionHost');
    moveNode('gvBattleNote', 'gvcActionHost');
    moveNode('gvClassicLink', 'gvcActionHost');

    const observeIds = [
      'gvTeamList','gvEnemyRoster','gvChallengeInfo','gvRewardInfo','gvGymPicker','gvLeaderName',
      'gvLeaderPortrait','gvDossierName','gvDossierType','gvRegionTitle','gvRegionalProgress'
    ];
    observeIds.forEach(id => {
      const node = $(id);
      if (!node) return;
      new MutationObserver(() => queueMicrotask(mirror)).observe(node, { childList: true, subtree: true, characterData: true, attributes: true });
    });

    document.addEventListener('languageChanged', () => setTimeout(mirror, 0));
    window.addEventListener('pageshow', () => setTimeout(() => { setup(); mirror(); }, 0));
    setInterval(mirror, 700);
    setTimeout(mirror, 50);
    setTimeout(mirror, 250);
    setTimeout(mirror, 800);
  }

  document.addEventListener('DOMContentLoaded', setup);
})();
