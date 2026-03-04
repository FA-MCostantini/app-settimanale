<?php declare(strict_types=1);

/**
 * This file is part of the Firstance BPER project.
 *
 * @copyright Firstance srl.
 */

namespace FirstAdvisory\FAWill\controller\settimanale;

class ctl_import_settimanale
{
    public function getHead(): string
    {
        return '<meta charset="UTF-8">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" rel="stylesheet">
                <link href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" rel="stylesheet">
                <link href="./assets-fa/css/settimanale/main.css" rel="stylesheet">
                <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>';
    }

    public function getSubTool(): string
    {
        return '';
    }

    public function getContent(): string
    {
        return '<div class="col-lg-12"><div id="app_import_settimanale_wrapper"><div id="app_import_settimanale"></div></div></div>';
    }

    public function getScript(): string
    {
        return '<script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
                <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
                <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
                <script src="./assets-fa/js/settimanale/app.js"></script>
                <script>
                    const { createApp } = Vue;
                    const app = createApp(ImportSettimanaleApp);
                    app.directive("flatpickr", {
                        mounted(el, binding) {
                            el._fp = flatpickr(el, {
                                dateFormat: "d/m/Y",
                                allowInput: true,
                                onChange: function(selectedDates, dateStr) {
                                    el.value = dateStr;
                                    el.dispatchEvent(new Event("input"));
                                }
                            });
                            if (binding.value) {
                                el._fp.setDate(binding.value, false, "d/m/Y");
                            }
                        },
                        updated(el, binding) {
                            if (el._fp && binding.value !== binding.oldValue) {
                                el._fp.setDate(binding.value || "", false, "d/m/Y");
                            }
                        },
                        unmounted(el) {
                            if (el._fp) el._fp.destroy();
                        }
                    });
                    app.mount("#app_import_settimanale");
                </script>';
    }
}
