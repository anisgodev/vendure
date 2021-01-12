import { ChangeDetectorRef, OnDestroy, Optional, Pipe, PipeTransform } from '@angular/core';
import { DataService } from '@vendure/admin-ui/core';
import { Subscription } from 'rxjs';

import { LanguageCode } from '../../common/generated-types';

/**
 * @description
 * A replacement of the Angular DatePipe which makes use of the Intl API
 * to format dates according to the selected UI language.
 */
@Pipe({
    name: 'localeDate',
    pure: false,
})
export class LocaleDatePipe implements PipeTransform, OnDestroy {
    private locale: string;
    private readonly subscription: Subscription;

    constructor(
        @Optional() private dataService?: DataService,
        @Optional() changeDetectorRef?: ChangeDetectorRef,
    ) {
        if (this.dataService && changeDetectorRef) {
            this.subscription = this.dataService.client
                .uiState()
                .mapStream(data => data.uiState.language)
                .subscribe(languageCode => {
                    this.locale = languageCode.replace(/_/g, '-');
                    changeDetectorRef.markForCheck();
                });
        }
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    transform(value: unknown, ...args: unknown[]): unknown {
        const [format, locale] = args;
        if (this.locale || typeof locale === 'string') {
            const activeLocale = typeof locale === 'string' ? locale : this.locale;
            const date =
                value instanceof Date ? value : typeof value === 'string' ? new Date(value) : undefined;
            if (date) {
                const options = this.getOptionsForFormat(typeof format === 'string' ? format : 'medium');
                return new Intl.DateTimeFormat(activeLocale, options).format(date);
            }
        }
    }

    private getOptionsForFormat(dateFormat: string): Intl.DateTimeFormatOptions | undefined {
        switch (dateFormat) {
            case 'medium':
                return {
                    month: 'short',
                    year: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: true,
                };
            case 'mediumTime':
                return {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: true,
                };
            case 'longDate':
                return {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                };
            case 'short':
                return {
                    day: 'numeric',
                    month: 'numeric',
                    year: '2-digit',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                };
            default:
                return;
        }
    }
}