import * as ts from "typescript";
import { LogLevel } from "simplr-logger";

import { ApiHelpers } from "../api-helpers";
import { ApiItem } from "../abstractions/api-item";
import { ApiMetadataDto } from "../contracts/api-metadata-dto";
import { ApiItemLocationDto } from "../contracts/api-item-location-dto";
import { ApiDefinitionKind, ApiSetAccessorDto } from "../contracts/api-definitions";
import { ApiItemReference } from "../contracts/api-item-reference";
import { AccessModifier } from "../contracts/access-modifier";

export class ApiSetAccessor extends ApiItem<ts.SetAccessorDeclaration, ApiSetAccessorDto> {
    private location: ApiItemLocationDto;
    private accessModifier: AccessModifier;
    private isAbstract: boolean;
    private isStatic: boolean;
    private parameter: ApiItemReference | undefined;

    protected OnGatherData(): void {
        // ApiItemLocation
        this.location = ApiHelpers.GetApiItemLocationDtoFromNode(this.Declaration, this.Options);

        // Modifiers
        this.accessModifier = ApiHelpers.ResolveAccessModifierFromModifiers(this.Declaration.modifiers);
        this.isAbstract = ApiHelpers.ModifierKindExistsInModifiers(this.Declaration.modifiers, ts.SyntaxKind.AbstractKeyword);
        this.isStatic = ApiHelpers.ModifierKindExistsInModifiers(this.Declaration.modifiers, ts.SyntaxKind.StaticKeyword);

        // Parameter
        const parameters = ApiHelpers.GetItemsIdsFromDeclarations(this.Declaration.parameters, this.Options);

        if (parameters.length !== 1) {
            const message = `A 'set' accessor must have exactly one parameter, it has ${parameters.length}.`;
            ApiHelpers.LogWithNodePosition(
                LogLevel.Error,
                this.Declaration,
                message
            );
        } else {
            this.parameter = parameters[0];
        }
    }

    public OnExtract(): ApiSetAccessorDto {
        const parentId: string | undefined = ApiHelpers.GetParentIdFromDeclaration(this.Declaration, this.Options);
        const metadata: ApiMetadataDto = this.GetItemMetadata();

        return {
            ApiKind: ApiDefinitionKind.SetAccessor,
            Name: this.Symbol.name,
            ParentId: parentId,
            Metadata: metadata,
            Location: this.location,
            AccessModifier: this.accessModifier,
            IsAbstract: this.isAbstract,
            IsStatic: this.isStatic,
            Parameter: this.parameter,
            _ts: this.GetTsDebugInfo()
        };
    }
}
