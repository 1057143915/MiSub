import { DOMWrapper, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SubscriptionPanel from '../../src/components/subscriptions/SubscriptionPanel.vue';
import { createI18n } from '../../src/i18n/index.js';

const baseProps = {
    currentPage: 1,
    totalPages: 1,
    isSorting: false,
};

function mountPanel(props = {}) {
    return mount(SubscriptionPanel, {
        attachTo: document.body,
        props: {
            ...baseProps,
            subscriptions: [],
            paginatedSubscriptions: [],
            ...props,
        },
        global: {
            plugins: [createPinia(), createI18n({ initialLocale: 'zh-CN' })],
            stubs: {
                Card: {
                    props: ['misub'],
                    template: '<article class="card-stub">{{ misub.name }}</article>',
                },
                EmptyState: {
                    props: ['title', 'description'],
                    template:
                        '<div class="empty-state-stub"><h3>{{ title }}</h3><p>{{ description }}</p><slot /></div>',
                },
                MoreActionsMenu: { template: '<div><slot name="menu" :close="() => {}" /></div>' },
                draggable: {
                    template:
                        '<div><slot name="item" v-for="element in modelValue" :element="element" /></div>',
                    props: ['modelValue'],
                },
            },
        },
    });
}

function perPageSelect(wrapper) {
    return wrapper.find('select');
}

describe('SubscriptionPanel per-page selector', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        window.localStorage.clear();
    });

    it('hides the per-page selector when everything fits on one page at the default size', () => {
        const wrapper = mountPanel({
            subscriptions: new Array(3).fill(0).map((_, i) => ({ id: `s${i}`, name: `sub${i}` })),
            itemsPerPage: 6,
        });

        expect(perPageSelect(wrapper).exists()).toBe(false);
    });

    it('shows the per-page selector once subscriptions exceed the default page size', () => {
        const subs = new Array(12).fill(0).map((_, i) => ({ id: `s${i}`, name: `sub${i}` }));
        const wrapper = mountPanel({
            subscriptions: subs,
            paginatedSubscriptions: subs.slice(0, 6),
            itemsPerPage: 6,
            totalPages: 2,
        });

        const select = perPageSelect(wrapper);
        expect(select.exists()).toBe(true);
        expect(select.findAll('option').map((o) => o.text())).toEqual([
            '6',
            '10',
            '20',
            '50',
            '全部',
        ]);
    });

    it('keeps the selector visible when the user already picked a non-default size', () => {
        const wrapper = mountPanel({
            subscriptions: [{ id: 's0', name: 'sub0' }],
            itemsPerPage: -1,
            totalPages: 1,
        });

        expect(perPageSelect(wrapper).exists()).toBe(true);
    });

    it('emits update:itemsPerPage with a number when the selection changes', async () => {
        const subs = new Array(12).fill(0).map((_, i) => ({ id: `s${i}`, name: `sub${i}` }));
        const wrapper = mountPanel({
            subscriptions: subs,
            paginatedSubscriptions: subs.slice(0, 6),
            itemsPerPage: 6,
            totalPages: 2,
        });

        const select = perPageSelect(wrapper);
        await select.setValue('50');

        const emitted = wrapper.emitted('update:itemsPerPage');
        expect(emitted).toBeTruthy();
        expect(emitted.at(-1)).toEqual([50]);
    });
});
